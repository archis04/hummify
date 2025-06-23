import librosa
import numpy as np
import argparse
import json
import tempfile
import requests
import os
import subprocess
from scipy.signal import savgol_filter, find_peaks, medfilt  # Added medfilt import
import crepe
import noisereduce as nr
import sys
import traceback
import logging
import multiprocessing
import tensorflow as tf
from sklearn.cluster import KMeans

# Configure detailed logging
logging.basicConfig(
    level=logging.INFO,
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
    """Convert audio to WAV format using ffmpeg"""
    try:
        logger.info(f"Converting to WAV: {input_path} → {output_path}")
        result = subprocess.run([
            "ffmpeg", "-y", "-i", input_path,
            "-ac", "1", "-ar", "44100", "-acodec", "pcm_s16le",
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
    """Run CREPE in a separate process with timeout"""
    try:
        queue = multiprocessing.Queue()
        process = multiprocessing.Process(
            target=_crepe_worker,
            args=(y, sr, step_size, queue)
        )
        process.start()
        process.join(timeout=60)  # Increased timeout to 60 seconds
        
        if process.is_alive():
            logger.warning("CREPE timed out after 60 seconds")
            process.terminate()
            process.join()
            return None, None, None, None
        
        if not queue.empty():
            return queue.get()
        
        logger.warning("CREPE returned no results")
        return None, None, None, None
        
    except Exception as e:
        logger.error(f"CREPE processing failed: {str(e)}")
        return None, None, None, None

def _crepe_worker(y, sr, step_size, queue):
    """Worker function for CREPE processing"""
    try:
        times_crepe, f0_crepe, confidence, _ = crepe.predict(
            y, sr, viterbi=True, model_capacity="full", 
            step_size=step_size, center=True, verbose=0
        )
        queue.put((times_crepe, f0_crepe, confidence, None))
    except Exception as e:
        logger.error(f"CREPE error in worker: {str(e)}")
        queue.put((None, None, None, str(e)))

def get_vocal_pitch(y, sr, frame_length=2048, hop_length=512):
    """Improved hybrid pitch detection using CREPE + PYIN with smoothing and false-positive suppression."""
    f0_pyin, voiced_flag, voiced_probs = librosa.pyin(
        y, fmin=75, fmax=1000, sr=sr,
        frame_length=frame_length, hop_length=hop_length,
        fill_na=0, resolution=0.05, boltzmann_parameter=1.5
    )
    n_frames = len(f0_pyin)
    frame_times = librosa.frames_to_time(np.arange(n_frames), sr=sr, hop_length=hop_length)

    crepe_step_size = int(round(1000 * hop_length / sr))
    times_crepe, f0_crepe, confidence_crepe, _ = run_crepe(y, sr, crepe_step_size)

    f0 = np.zeros(n_frames)
    confidences = np.zeros(n_frames)

    if times_crepe is not None:
        f0_crepe_aligned = np.interp(frame_times, times_crepe, f0_crepe, left=0, right=0)
        conf_crepe_aligned = np.interp(frame_times, times_crepe, confidence_crepe, left=0, right=0)

        for i in range(n_frames):
            pyin_val = f0_pyin[i]
            pyin_conf = voiced_probs[i]
            crepe_val = f0_crepe_aligned[i]
            crepe_conf = conf_crepe_aligned[i]
            total_conf = pyin_conf + crepe_conf

            if total_conf > 0.6:
                f0[i] = (pyin_val * pyin_conf + crepe_val * crepe_conf) / total_conf
                confidences[i] = max(pyin_conf, crepe_conf)
            else:
                f0[i] = 0
                confidences[i] = 0
    else:
        logger.warning("Using PYIN only due to CREPE failure")
        f0 = f0_pyin
        confidences = voiced_probs

    # Harmonic smoothing (remove octave glitches)
    f0 = medfilt(f0, kernel_size=7)

    # Log-frequency smoothing
    midi_f0 = librosa.hz_to_midi(f0)
    valid_mask = (f0 > 0)
    if valid_mask.sum() >= 5:
        smoothed_midi = midi_f0.copy()
        smoothed_midi[valid_mask] = savgol_filter(midi_f0[valid_mask], window_length=15, polyorder=2)
        f0_smoothed = librosa.midi_to_hz(smoothed_midi)
    else:
        f0_smoothed = f0

    # Post-filter isolated spikes
    mask = (f0_smoothed > 0) & (np.roll(f0_smoothed, 1) == 0) & (np.roll(f0_smoothed, -1) == 0)
    f0_smoothed[mask] = 0

    return f0_smoothed, confidences, frame_times



def detect_note_boundaries(y, sr, hop_length=512, frame_length=2048):
    """Improved note boundary detection with false positive suppression."""
    onset_env = librosa.onset.onset_strength(
        y=y, sr=sr, hop_length=hop_length, aggregate=np.median,
        fmax=1000, n_mels=40
    )

    S = np.abs(librosa.stft(y, n_fft=frame_length, hop_length=hop_length))
    spectral_flux = np.sum(np.maximum(0, S[1:] - S[:-1]), axis=0)

    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    rms_diff = np.diff(rms, prepend=[0])

    onset_env = librosa.util.normalize(onset_env)
    spectral_flux = librosa.util.normalize(spectral_flux[:len(onset_env)])
    rms_diff = librosa.util.normalize(rms_diff[:len(onset_env)])

    combined = 0.6 * onset_env + 0.3 * spectral_flux + 0.1 * rms_diff

    onset_frames = librosa.onset.onset_detect(
        onset_envelope=combined, sr=sr, hop_length=hop_length,
        units='frames', pre_max=4, post_max=4, delta=0.03, wait=4
    )

    rms_threshold = np.percentile(rms, 40)
    offset_frames = []
    for i in range(1, len(rms) - 1):
        if rms[i] < rms[i - 1] and rms[i] < rms[i + 1] and rms[i] < rms_threshold:
            offset_frames.append(i)

    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)
    offset_times = librosa.frames_to_time(offset_frames, sr=sr, hop_length=hop_length)

    all_boundaries = np.sort(np.unique(np.concatenate([
        [0], onset_times, offset_times, [len(y)/sr]
    ])))

    # Remove boundaries too close together (<50ms)
    pruned = [all_boundaries[0]]
    for t in all_boundaries[1:]:
        if t - pruned[-1] >= 0.05:
            pruned.append(t)

    logger.info(f"Detected {len(pruned)} pruned boundaries")
    return np.array(pruned)



def get_dominant_pitch(f0, confidences, start_frame, end_frame):
    """Get the dominant pitch in a segment using confidence-weighted clustering."""
    segment_f0 = f0[start_frame:end_frame]
    segment_conf = confidences[start_frame:end_frame]

    # Filter out low-confidence or invalid pitches
    valid_mask = (segment_f0 > 75) & (segment_f0 < 1000) & (segment_conf > 0.4)
    valid_f0 = segment_f0[valid_mask]
    valid_conf = segment_conf[valid_mask]

    if len(valid_f0) < 3:
        return None, 0.0

    try:
        # Use log-frequency (MIDI) for better clustering
        midi_f0 = librosa.hz_to_midi(valid_f0).reshape(-1, 1)
        kmeans = KMeans(n_clusters=min(3, len(midi_f0)), random_state=0, n_init=10)
        kmeans.fit(midi_f0)

        cluster_sizes = np.bincount(kmeans.labels_)
        dominant_cluster = np.argmax(cluster_sizes)
        dominant_midi = kmeans.cluster_centers_[dominant_cluster][0]
        confidence = cluster_sizes[dominant_cluster] / len(valid_f0)

        pitch_hz = librosa.midi_to_hz(dominant_midi)
        return pitch_hz, confidence

    except Exception as e:
        # Fallback to weighted median if clustering fails
        weighted = [(f, c) for f, c in zip(valid_f0, valid_conf)]
        weighted.sort()
        total = sum(c for _, c in weighted)
        cumsum = 0
        for f, c in weighted:
            cumsum += c
            if cumsum >= total / 2:
                return f, 1.0

    return np.median(valid_f0), 1.0


def apply_musical_corrections(notes, duration):
    """Apply musical corrections to note sequence with less strict time merging"""
    if not notes:
        return notes
    
    # 1. Merge notes with less strict time conditions
    consolidated = []
    current_note = notes[0]
    
    for i in range(1, len(notes)):
        next_note = notes[i]
        gap = next_note['start'] - current_note['end']
        
        # Calculate pitch difference in semitones (same as before)
        current_pitch = librosa.note_to_midi(current_note['note'])
        next_pitch = librosa.note_to_midi(next_note['note'])
        pitch_diff = abs(current_pitch - next_pitch)
        
       
        if gap < 0.04 and pitch_diff < 1.0:
            # Extend current note
            current_note['end'] = next_note['end']
            current_note['duration'] = round(current_note['end'] - current_note['start'], 3)
            # Average volume
            current_note['volume'] = int((current_note['volume'] + next_note['volume']) / 2)
        else:
            consolidated.append(current_note)
            current_note = next_note
    
    consolidated.append(current_note)
    
    # 2. Keep short note filtering (original threshold)
    consolidated = [n for n in consolidated if n['duration'] > 0.04]
    
    # 3. Scale-based pitch correction (unchanged)
    if consolidated:
        # Detect key signature from pitches
        midi_notes = [librosa.note_to_midi(n['note']) for n in consolidated]
        if midi_notes:
            key_center = np.median(midi_notes)
            scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            
            for note in consolidated:
                midi_num = librosa.note_to_midi(note['note'])
                # Quantize to nearest scale degree
                quantized = int(round(midi_num))
                note['note'] = librosa.midi_to_note(quantized, cents=False)
    
    return consolidated


def main():
    parser = argparse.ArgumentParser(description='Convert audio to MIDI-like note data')
    parser.add_argument("audio_url", help="Cloudinary audio URL")
    args = parser.parse_args()

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            logger.info(f"Created temporary directory: {tmpdir}")
            
            # Download and convert
            ext = os.path.splitext(args.audio_url)[1] or ".webm"
            input_path = os.path.join(tmpdir, f"input{ext}")
            output_path = os.path.join(tmpdir, "converted.wav")
            
            if not download_audio(args.audio_url, input_path):
                raise Exception("Audio download failed")
            if not convert_to_wav(input_path, output_path):
                raise Exception("Audio conversion failed")
            
            # Load audio with noise reduction
            logger.info("Loading and processing audio")
            y, sr = librosa.load(output_path, sr=44100, mono=True)
            duration = len(y)/sr
            logger.info(f"Audio loaded: {len(y)} samples, {duration:.2f} seconds")
            
            # Vocal-optimized noise reduction
            y = nr.reduce_noise(y=y, sr=sr, stationary=True, prop_decrease=0.8)
            y = librosa.util.normalize(y)
            
            # === HYBRID PITCH DETECTION ===
            hop_length = 512
            frame_length = 2048
            
            logger.info("Running hybrid pitch detection")
            f0, confidences, frame_times = get_vocal_pitch(y, sr, frame_length, hop_length)
            n_frames = len(f0)
            
            # === ADVANCED NOTE BOUNDARY DETECTION ===
            logger.info("Detecting note boundaries")
            boundaries = detect_note_boundaries(y, sr, hop_length, frame_length)
            
            # === NOTE SEGMENTATION ===
            logger.info("Creating note segments")
            rms_energy = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
            notes = []
            
            for i in range(len(boundaries) - 1):
                start = boundaries[i]
                end = boundaries[i+1]
                dur = end - start
                
                # Skip very short segments
                if dur < 0.1:  # 70ms minimum
                    continue
                
                # Get frame indices
                frame_start = max(0, min(n_frames-1, int(start * sr / hop_length)))
                frame_end = max(0, min(n_frames, int(end * sr / hop_length)))
                
                # Skip segments with low energy
                segment_rms = rms_energy[frame_start:frame_end]
                if np.mean(segment_rms) < 0.005:
                    continue
                
                # Get dominant pitch using clustering method
                pitch_hz, pitch_confidence = get_dominant_pitch(f0, confidences, frame_start, frame_end)
                if pitch_hz is None or pitch_confidence < 0.4:
                    continue
                
                # Volume calculation (avoid extreme peaks)
                volume = int(np.interp(np.percentile(segment_rms, 75), 
                                    [0.005, 0.3], [40, 127]))
                
                # Note naming with quantization
                midi_num = librosa.hz_to_midi(pitch_hz)
                quantized_midi = round(midi_num)
                note_name = librosa.midi_to_note(quantized_midi, cents=False)
                
                notes.append({
                    "note": note_name,
                    "start": round(start, 3),
                    "end": round(end, 3),
                    "duration": round(dur, 3),
                    "volume": volume
                })
            
            logger.info(f"Created {len(notes)} raw notes")
            
            # === MUSICAL POST-PROCESSING ===
            logger.info("Applying musical corrections")
            final_notes = apply_musical_corrections(notes, duration)
            logger.info(f"Final note count: {len(final_notes)}")
            
            # Output pure JSON
            print(json.dumps(final_notes, indent=2))
    
    except Exception as e:
        error_info = {"error": str(e), "traceback": traceback.format_exc()}
        print(json.dumps(error_info, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    multiprocessing.set_start_method('spawn')
    main()