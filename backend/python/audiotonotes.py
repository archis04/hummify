import librosa
import numpy as np
import argparse
import json
import tempfile
import requests
import os
import subprocess
from scipy.signal import savgol_filter, find_peaks, medfilt
import crepe
import noisereduce as nr
import sys
import traceback
import logging
import multiprocessing
import tensorflow as tf

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG for more verbose output
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger('audio2notes')

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.get_logger().setLevel('ERROR')

def download_audio(url, path):
    """Download audio with retries and progress tracking"""
    try:
        logger.info(f"Downloading audio from: {url}")
        response = requests.get(url, stream=True, timeout=15)
        response.raise_for_status()
        
        with open(path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        file_size = os.path.getsize(path) / 1024
        logger.info(f"Download complete. Size: {file_size:.1f} KB")
        return True
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        return False

def convert_to_wav(input_path, output_path):
    """Convert audio to WAV format using ffmpeg with optimized parameters"""
    try:
        logger.info(f"Converting to WAV: {input_path} → {output_path}")
        result = subprocess.run([
            "ffmpeg", "-y", "-i", input_path,
            "-ac", "1", "-ar", "22050", "-acodec", "pcm_s16le",
            output_path
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg conversion failed: {result.stderr}")
            return False
        
        wav_size = os.path.getsize(output_path) / 1024
        logger.info(f"Conversion complete. WAV size: {wav_size:.1f} KB")
        return True
    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        return False

def run_crepe(y, sr, step_size):
    """Run CREPE in a separate process with timeout and medium model"""
    try:
        logger.debug(f"Starting CREPE with step_size={step_size}ms")
        queue = multiprocessing.Queue()
        process = multiprocessing.Process(
            target=_crepe_worker,
            args=(y, sr, step_size, queue)
        )
        process.start()
        process.join(timeout=45)
        
        if process.is_alive():
            logger.warning("CREPE timed out after 45 seconds")
            process.terminate()
            process.join()
            return None, None, None, None
        
        if not queue.empty():
            result = queue.get()
            logger.debug(f"CREPE returned {len(result[0])} frames")
            return result
        
        logger.warning("CREPE returned no results")
        return None, None, None, None
        
    except Exception as e:
        logger.error(f"CREPE processing failed: {str(e)}")
        return None, None, None, None

def _crepe_worker(y, sr, step_size, queue):
    """Worker function for CREPE processing with medium model"""
    try:
        times_crepe, f0_crepe, confidence, _ = crepe.predict(
            y, sr, viterbi=True, model_capacity="medium",
            step_size=step_size, center=True, verbose=0
        )
        logger.debug(f"CREPE worker completed: {len(times_crepe)} frames")
        queue.put((times_crepe, f0_crepe, confidence, None))
    except Exception as e:
        logger.error(f"CREPE error in worker: {str(e)}")
        queue.put((None, None, None, str(e)))

def get_vocal_pitch(y, sr, frame_length=1024, hop_length=256):
    """Optimized hybrid pitch detection with reduced computational load"""
    logger.debug("Starting PYIN pitch detection")
    f0_pyin, voiced_flag, voiced_probs = librosa.pyin(
        y, fmin=75, fmax=1000, sr=sr,
        frame_length=frame_length, hop_length=hop_length,
        fill_na=0, resolution=0.1,
        boltzmann_parameter=2.0
    )
    n_frames = len(f0_pyin)
    frame_times = librosa.frames_to_time(np.arange(n_frames), sr=sr, hop_length=hop_length)
    logger.debug(f"PYIN completed: {n_frames} frames")

    crepe_step_size = int(round(1000 * hop_length / sr))
    times_crepe, f0_crepe, confidence_crepe, _ = run_crepe(y, sr, crepe_step_size)

    f0 = np.zeros(n_frames)
    confidences = np.zeros(n_frames)

    if times_crepe is not None:
        logger.debug("Aligning CREPE results with PYIN frames")
        f0_crepe_aligned = np.interp(frame_times, times_crepe, f0_crepe, left=0, right=0)
        conf_crepe_aligned = np.interp(frame_times, times_crepe, confidence_crepe, left=0, right=0)

        for i in range(n_frames):
            pyin_val = f0_pyin[i] if not np.isnan(f0_pyin[i]) else 0
            pyin_conf = voiced_probs[i] if not np.isnan(voiced_probs[i]) else 0
            crepe_val = f0_crepe_aligned[i]
            crepe_conf = conf_crepe_aligned[i]
            total_conf = pyin_conf + crepe_conf

            if total_conf > 0.6:
                f0[i] = (pyin_val * pyin_conf + crepe_val * crepe_conf) / total_conf
                confidences[i] = max(pyin_conf, crepe_conf)
            else:
                f0[i] = 0
                confidences[i] = 0
        logger.debug("Hybrid pitch fusion completed")
    else:
        logger.warning("Using PYIN only due to CREPE failure")
        f0 = np.nan_to_num(f0_pyin, nan=0)
        confidences = np.nan_to_num(voiced_probs, nan=0)

    f0 = medfilt(f0, kernel_size=5)
    logger.debug(f"Pitch range: min={np.min(f0):.1f}Hz, max={np.max(f0):.1f}Hz")
    return f0, confidences, frame_times

def detect_note_boundaries(y, sr, hop_length=256, frame_length=1024):
    """Optimized note boundary detection with higher thresholds"""
    logger.debug("Calculating onset strength")
    onset_env = librosa.onset.onset_strength(
        y=y, sr=sr, hop_length=hop_length, aggregate=np.median,
        fmax=800, n_mels=32
    )

    logger.debug("Calculating spectral flux")
    S = np.abs(librosa.stft(y, n_fft=frame_length, hop_length=hop_length))
    spectral_flux = np.sum(np.maximum(0, S[1:] - S[:-1]), axis=0)

    logger.debug("Calculating RMS energy")
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    rms_diff = np.diff(rms, prepend=[0])

    onset_env = librosa.util.normalize(onset_env)
    spectral_flux = librosa.util.normalize(spectral_flux[:len(onset_env)])
    rms_diff = librosa.util.normalize(rms_diff[:len(onset_env)])

    combined = 0.7 * onset_env + 0.2 * spectral_flux + 0.1 * rms_diff
    logger.debug(f"Combined boundary detection signal: len={len(combined)}")

    onset_frames = librosa.onset.onset_detect(
        onset_envelope=combined, sr=sr, hop_length=hop_length,
        units='frames', pre_max=3, post_max=3, delta=0.05,
        wait=int(round(0.08 * sr / hop_length))
    )
    logger.debug(f"Detected {len(onset_frames)} onset frames")

    rms_threshold = np.percentile(rms, 50)
    offset_frames = []
    for i in range(1, len(rms) - 1):
        if (rms[i] < 0.8 * rms[i - 1] and
            rms[i] < 0.8 * rms[i + 1] and 
            rms[i] < rms_threshold):
            offset_frames.append(i)
    logger.debug(f"Detected {len(offset_frames)} offset frames")

    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)
    offset_times = librosa.frames_to_time(offset_frames, sr=sr, hop_length=hop_length)

    all_boundaries = np.sort(np.unique(np.concatenate([
        [0], onset_times, offset_times, [len(y)/sr]
    ])))
    logger.debug(f"Raw boundaries: {len(all_boundaries)} points")
    
    # Ensure final boundary is always preserved
    pruned = [all_boundaries[0]]
    for t in all_boundaries[1:]:
        # Always include the final boundary
        if t == all_boundaries[-1] or t - pruned[-1] >= 0.08:
            pruned.append(t)

    logger.info(f"Detected {len(pruned)} pruned boundaries")
    logger.debug(f"Pruned boundaries: {pruned}")
    return np.array(pruned)

def get_dominant_pitch(f0, confidences, start_frame, end_frame):
    """Simplified pitch detection using weighted median"""
    segment_f0 = f0[start_frame:end_frame]
    segment_conf = confidences[start_frame:end_frame]
    
    valid_mask = (segment_f0 > 75) & (segment_f0 < 1000) & (segment_conf > 0.4)
    valid_f0 = segment_f0[valid_mask]
    valid_conf = segment_conf[valid_mask]

    if len(valid_f0) < 3:
        logger.debug(f"Segment [{start_frame}:{end_frame}] - insufficient valid frames: {len(valid_f0)}")
        return None, 0.0

    sorted_idx = np.argsort(valid_f0)
    sorted_f0 = valid_f0[sorted_idx]
    sorted_conf = valid_conf[sorted_idx]
    
    cum_weights = np.cumsum(sorted_conf)
    total_weight = cum_weights[-1]
    median_idx = np.searchsorted(cum_weights, total_weight * 0.5)
    
    result_f0 = sorted_f0[median_idx]
    result_conf = sorted_conf[median_idx]
    
    logger.debug(f"Segment [{start_frame}:{end_frame}] - "
                 f"frames: {len(segment_f0)}, valid: {len(valid_f0)}, "
                 f"pitch: {result_f0:.1f}Hz, conf: {result_conf:.2f}")
    
    return result_f0, result_conf

def apply_musical_corrections(notes, min_gap=0.05, min_duration=0.05, max_pitch_diff=0.5, min_volume_diff=10):
    """Enhanced musical corrections with parameters matching the pipeline's characteristics"""
    if not notes:
        return notes
    
    logger.debug(f"Starting musical corrections with {len(notes)} notes")
    
    consolidated = []
    current_note = notes[0]
    
    for next_note in notes[1:]:
        gap = next_note['start'] - current_note['end']
        
        try:
            current_pitch = librosa.note_to_midi(current_note['note'])
            next_pitch = librosa.note_to_midi(next_note['note'])
            pitch_diff = abs(current_pitch - next_pitch)
            volume_diff = abs(current_note['volume'] - next_note['volume'])
        except Exception as e:
            logger.debug(f"Note conversion error: {e}")
            consolidated.append(current_note)
            current_note = next_note
            continue
        
        if (gap < min_gap and 
            pitch_diff < max_pitch_diff and
            volume_diff < min_volume_diff):
            
            current_note['end'] = next_note['end']
            current_note['duration'] = round(current_note['end'] - current_note['start'], 3)
            
            total_dur = current_note['duration'] + next_note['duration']
            current_note['volume'] = int(
                (current_note['volume'] * current_note['duration'] + 
                 next_note['volume'] * next_note['duration']) / total_dur
            )
            
            logger.debug(
                f"Merged: {current_note['note']} + {next_note['note']} | "
                f"Gap: {gap:.3f}s, Pitch Δ: {pitch_diff:.1f}, Vol Δ: {volume_diff}"
            )
        else:
            consolidated.append(current_note)
            current_note = next_note
    
    consolidated.append(current_note)
    
    consolidated = [n for n in consolidated if n['duration'] >= min_duration]
    
    logger.info(
        f"Musical corrections applied. Notes: {len(notes)} → {len(consolidated)} | "
        f"Params: gap={min_gap}s, dur={min_duration}s, "
        f"pitchΔ={max_pitch_diff}semitones, volΔ={min_volume_diff}"
    )
    
    logger.debug(f"Consolidated notes: {json.dumps(consolidated, indent=2)}")
    return consolidated

def main():
    parser = argparse.ArgumentParser(description='Convert audio to MIDI-like note data')
    parser.add_argument("audio_url", help="Cloudinary audio URL")
    args = parser.parse_args()

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            logger.info(f"Created temporary directory: {tmpdir}")
            
            ext = os.path.splitext(args.audio_url)[1] or ".webm"
            input_path = os.path.join(tmpdir, f"input{ext}")
            output_path = os.path.join(tmpdir, "converted.wav")
            
            if not download_audio(args.audio_url, input_path):
                raise Exception("Audio download failed")
            if not convert_to_wav(input_path, output_path):
                raise Exception("Audio conversion failed")
            
            logger.info("Loading and processing audio")
            y, sr = librosa.load(output_path, sr=None, mono=True)
            duration = len(y)/sr
            logger.info(f"Audio loaded: {len(y)} samples, {duration:.2f} seconds, SR: {sr}Hz")
            
            logger.debug("Applying noise reduction and normalization")
            y = nr.reduce_noise(y=y, sr=sr, stationary=True, prop_decrease=0.5)
            y = librosa.util.normalize(y)
            
            hop_length = 256
            frame_length = 1024
            
            logger.info("Running optimized pitch detection")
            f0, confidences, frame_times = get_vocal_pitch(y, sr, frame_length, hop_length)
            n_frames = len(f0)
            logger.debug(f"Pitch tracking: {n_frames} frames")
            
            logger.info("Detecting note boundaries with tuned parameters")
            boundaries = detect_note_boundaries(y, sr, hop_length, frame_length)
            logger.debug(f"Boundary times: {boundaries}")
            
            logger.info("Creating note segments")
            rms_energy = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
            notes = []
            
            total_duration = len(y) / sr
            logger.debug(f"Total audio duration: {total_duration:.2f}s")
            
            for i in range(len(boundaries) - 1):
                start = boundaries[i]
                end = boundaries[i+1]
                dur = end - start
                
                if dur < 0.08:
                    logger.debug(f"Skipping short segment: {start:.3f}-{end:.3f} ({dur:.3f}s)")
                    continue
                
                frame_start = max(0, min(n_frames, int(np.floor(start * sr / hop_length))))
                frame_end = max(0, min(n_frames, int(np.ceil(end * sr / hop_length))))
                
                if frame_start >= frame_end:
                    logger.debug(f"Invalid frame range: {frame_start} >= {frame_end}")
                    continue
                
                segment_rms = rms_energy[frame_start:frame_end]
                mean_rms = np.mean(segment_rms)
                
                if mean_rms < 0.001:
                    logger.debug(f"Skipping low-energy segment: {start:.3f}-{end:.3f} (RMS: {mean_rms:.4f})")
                    continue
                
                pitch_hz, pitch_confidence = get_dominant_pitch(f0, confidences, frame_start, frame_end)
                if pitch_hz is None or pitch_confidence < 0.4:
                    logger.debug(f"Skipping low-confidence segment: {start:.3f}-{end:.3f} "
                                 f"(conf: {pitch_confidence:.2f})")
                    continue
                
                volume = int(np.interp(np.percentile(segment_rms, 75), 
                                    [0.001, 0.3], [40, 127]))
                
                midi_num = librosa.hz_to_midi(pitch_hz)
                quantized_midi = round(midi_num)
                note_name = librosa.midi_to_note(quantized_midi, cents=False)
                
                new_note = {
                    "note": note_name,
                    "start": round(start, 3),
                    "end": round(end, 3),
                    "duration": round(dur, 3),
                    "volume": volume
                }
                notes.append(new_note)
                logger.debug(f"Created note: {json.dumps(new_note)}")
            
            # Handle final segment if needed
            if boundaries[-1] < total_duration:
                end_time = total_duration
                dur = end_time - boundaries[-1]
                if dur >= 0.08:
                    frame_start = max(0, min(n_frames, int(np.floor(boundaries[-1] * sr / hop_length))))
                    frame_end = n_frames
                    
                    segment_rms = rms_energy[frame_start:frame_end]
                    mean_rms = np.mean(segment_rms)
                    if mean_rms >= 0.001:
                        pitch_hz, pitch_confidence = get_dominant_pitch(f0, confidences, frame_start, frame_end)
                        if pitch_hz is not None and pitch_confidence >= 0.4:
                            volume = int(np.interp(np.percentile(segment_rms, 75), 
                                                [0.001, 0.3], [40, 127]))
                            midi_num = librosa.hz_to_midi(pitch_hz)
                            quantized_midi = round(midi_num)
                            note_name = librosa.midi_to_note(quantized_midi, cents=False)
                            
                            new_note = {
                                "note": note_name,
                                "start": round(boundaries[-1], 3),
                                "end": round(end_time, 3),
                                "duration": round(dur, 3),
                                "volume": volume
                            }
                            notes.append(new_note)
                            logger.debug(f"Created final note: {json.dumps(new_note)}")
            
            logger.info(f"Created {len(notes)} raw notes")
            
            final_notes = apply_musical_corrections(
                notes,
                min_gap=0.05,
                min_duration=0.08,
                max_pitch_diff=0.5,
                min_volume_diff=10
            )
            
            if final_notes:
                coverage = final_notes[-1]['end'] / total_duration
                logger.info(f"Audio coverage: {coverage:.1%}")
            else:
                logger.warning("No notes generated")
            
            logger.info(f"Final note count: {len(final_notes)}")
            
            # Output with "notes" key
            output = {
                "success": True,
                "notes": final_notes
            }
            print(json.dumps(output, indent=2))
    
    except Exception as e:
        # Error output with success=false
        error_info = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        logger.error(f"Processing failed: {str(e)}")
        logger.debug(f"Traceback: {traceback.format_exc()}")
        print(json.dumps(error_info, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    multiprocessing.set_start_method('spawn')
    main()