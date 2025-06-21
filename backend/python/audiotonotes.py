import librosa
import numpy as np
import argparse
import json
import tempfile
import requests
import os
import subprocess
from scipy.signal import savgol_filter, find_peaks
import crepe
import noisereduce as nr
import sys
import traceback
import logging
import multiprocessing
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
        process.join(timeout=30)
        
        if process.is_alive():
            logger.warning("CREPE timed out after 30 seconds")
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

def get_dominant_pitch(f0, confidences, start_frame, end_frame):
    """Get the dominant pitch in a segment using clustering"""
    segment_f0 = f0[start_frame:end_frame]
    segment_conf = confidences[start_frame:end_frame]
    
    # Filter out low confidence and invalid pitches
    valid_mask = (segment_f0 > 80) & (segment_f0 < 800) & (segment_conf > 0.4)
    valid_f0 = segment_f0[valid_mask]
    
    if len(valid_f0) < 3:
        return None, 0.0
    
    # Use K-Means clustering to find the dominant pitch
    try:
        if len(valid_f0) > 1:
            kmeans = KMeans(n_clusters=min(3, len(valid_f0)), random_state=0)
            kmeans.fit(valid_f0.reshape(-1, 1))
            cluster_centers = kmeans.cluster_centers_.flatten()
            cluster_sizes = np.bincount(kmeans.labels_)
            
            # Find the cluster with the most points
            dominant_cluster = np.argmax(cluster_sizes)
            pitch_hz = cluster_centers[dominant_cluster]
            confidence = cluster_sizes[dominant_cluster] / len(valid_f0)
        else:
            pitch_hz = valid_f0[0]
            confidence = 1.0
            
        return pitch_hz, confidence
    except:
        # Fallback to median
        return np.median(valid_f0), 1.0

def adaptive_onset_detection(y, sr):
    """Improved onset detection with multiple feature fusion"""
    hop_length = 256
    frame_length = 2048
    
    # Compute multiple onset features
    onset_env1 = librosa.onset.onset_strength(
        y=y, sr=sr, hop_length=hop_length, 
        aggregate=np.median, fmax=1200, n_mels=32
    )
    
    # Spectral flux
    S = np.abs(librosa.stft(y, n_fft=frame_length, hop_length=hop_length))
    spectral_flux = np.sum(np.maximum(0, S[1:] - S[:-1]), axis=0)
    
    # RMS derivative
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    rms_diff = np.diff(rms, prepend=[0])
    
    # Normalize and combine features
    onset_env1 = librosa.util.normalize(onset_env1)
    spectral_flux = librosa.util.normalize(spectral_flux[:len(onset_env1)])
    rms_diff = librosa.util.normalize(rms_diff[:len(onset_env1)])
    
    # Combine features with weights optimized for vocals
    combined_onset = 0.6 * onset_env1 + 0.3 * spectral_flux + 0.1 * rms_diff
    
    # Detect onsets with adaptive threshold
    onset_frames = librosa.onset.onset_detect(
        onset_envelope=combined_onset, sr=sr, hop_length=hop_length,
        units='frames', pre_max=2, post_max=2, 
        delta=0.025, wait=3
    )
    
    # Backtrack to find precise onset locations
    refined_onsets = librosa.onset.onset_backtrack(onset_frames, combined_onset)
    onset_times = librosa.frames_to_time(refined_onsets, sr=sr, hop_length=hop_length)
    
    return onset_times

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
            y = nr.reduce_noise(y=y, sr=sr, stationary=True, prop_decrease=0.75)
            y = librosa.util.normalize(y)
            
            # === IMPROVED ONSET DETECTION ===
            logger.info("Running adaptive onset detection")
            onset_times = adaptive_onset_detection(y, sr)
            
            # Add start and end boundaries
            all_boundaries = np.concatenate([[0], onset_times, [duration]])
            logger.info(f"Detected {len(all_boundaries)} segment boundaries")
            
            # === ROBUST PITCH DETECTION ===
            hop_length = 256
            frame_length = 2048
            
            logger.info("Running PYIN pitch detection")
            f0_pyin, voiced_flag, voiced_probs = librosa.pyin(
                y, fmin=80, fmax=800, sr=sr,
                frame_length=frame_length, hop_length=hop_length,
                fill_na=0, resolution=0.05,
                boltzmann_parameter=1.5
            )
            n_frames = len(f0_pyin)
            frame_times = librosa.frames_to_time(np.arange(n_frames), sr=sr, hop_length=hop_length)
            
            # CREPE pitch detection with timeout
            logger.info("Running CREPE pitch detection")
            crepe_step_size = int(round(1000 * hop_length / sr))
            times_crepe, f0_crepe, confidence_crepe, _ = run_crepe(y, sr, crepe_step_size)
            
            # Create fused pitch estimate
            f0 = np.zeros(n_frames)
            confidences = np.zeros(n_frames)
            
            if times_crepe is not None:
                # Align CREPE to PYIN frames
                f0_crepe_aligned = np.interp(frame_times, times_crepe, f0_crepe, left=0, right=0)
                conf_crepe_aligned = np.interp(frame_times, times_crepe, confidence_crepe, left=0, right=0)
                
                # Fuse with preference for CREPE in confident regions
                for i in range(n_frames):
                    if conf_crepe_aligned[i] > 0.65 and f0_crepe_aligned[i] > 100:
                        f0[i] = f0_crepe_aligned[i]
                        confidences[i] = conf_crepe_aligned[i]
                    elif voiced_probs[i] > 0.75:
                        f0[i] = f0_pyin[i]
                        confidences[i] = voiced_probs[i]
                    else:
                        # Weighted average as fallback
                        f0[i] = (f0_pyin[i] * voiced_probs[i] + 
                                 f0_crepe_aligned[i] * conf_crepe_aligned[i]) / 2
                        confidences[i] = (voiced_probs[i] + conf_crepe_aligned[i]) / 2
            else:
                logger.warning("Using PYIN only due to CREPE failure")
                f0 = f0_pyin
                confidences = voiced_probs
            
            # Gentle smoothing with adaptive window
            window_size = min(7, len(f0))
            if window_size % 2 == 0:  # Ensure odd window size
                window_size = max(3, window_size - 1)
            f0_smoothed = savgol_filter(f0, window_length=window_size, polyorder=2)
            
            # === NOTE SEGMENTATION WITH PITCH TRACKING ===
            logger.info("Creating note segments")
            rms_energy = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
            notes = []
            min_duration = 0.08  # Reduced minimum note duration
            
            for i in range(len(all_boundaries) - 1):
                start = all_boundaries[i]
                end = all_boundaries[i+1]
                dur = end - start
                
                # Skip very short segments
                if dur < min_duration:
                    continue
                
                # Get frame indices
                frame_start = max(0, min(n_frames-1, int(start * sr / hop_length)))
                frame_end = max(0, min(n_frames, int(end * sr / hop_length)))
                
                # Skip segments with low energy
                segment_rms = rms_energy[frame_start:frame_end]
                if np.mean(segment_rms) < 0.005:
                    continue
                
                # Get dominant pitch using clustering method
                pitch_hz, pitch_confidence = get_dominant_pitch(f0_smoothed, confidences, frame_start, frame_end)
                if pitch_hz is None or pitch_confidence < 0.5:
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
            
            # === IMPROVED NOTE CONSOLIDATION ===
            logger.info("Consolidating notes")
            if not notes:
                print(json.dumps([], indent=2))
                return
                
            consolidated = []
            current_note = notes[0]
            
            for i in range(1, len(notes)):
                next_note = notes[i]
                gap = next_note['start'] - current_note['end']
                
                # Calculate pitch difference in semitones
                current_pitch = librosa.note_to_midi(current_note['note'])
                next_pitch = librosa.note_to_midi(next_note['note'])
                pitch_diff = abs(current_pitch - next_pitch)
                
                # Merge condition: small gap and similar pitch
                if gap < 0.05 and pitch_diff < 1.5:
                    # Extend current note
                    current_note['end'] = next_note['end']
                    current_note['duration'] = round(current_note['end'] - current_note['start'], 3)
                    # Average volume
                    current_note['volume'] = int((current_note['volume'] + next_note['volume']) / 2)
                else:
                    consolidated.append(current_note)
                    current_note = next_note
            
            consolidated.append(current_note)
            logger.info(f"Consolidated to {len(consolidated)} notes")
            
            # === POST-PROCESSING ===
            # 1. Filter out extremely short notes
            consolidated = [n for n in consolidated if n['duration'] > 0.1]
            
            # 2. Ensure reasonable volume range
            for note in consolidated:
                if note['volume'] < 40:
                    note['volume'] = 40
                elif note['volume'] > 127:
                    note['volume'] = 127
                # Round to integer
                note['volume'] = int(note['volume'])
            
            # 3. Adjust first and last notes
            if consolidated:
                # First note shouldn't start before audio
                consolidated[0]['start'] = max(0, consolidated[0]['start'])
                
                # Last note should extend to end of audio
                if consolidated[-1]['end'] < duration - 0.1:
                    consolidated[-1]['end'] = duration
                    consolidated[-1]['duration'] = round(duration - consolidated[-1]['start'], 3)
            
            # 4. Split long notes (duration > 0.5s) at pitch changes
            final_notes = []
            for note in consolidated:
                if note['duration'] > 0.5:
                    # Find pitch changes within long notes
                    start_frame = int(note['start'] * sr / hop_length)
                    end_frame = int(note['end'] * sr / hop_length)
                    
                    # Find significant pitch changes within the note
                    segment_f0 = f0_smoothed[start_frame:end_frame]
                    segment_conf = confidences[start_frame:end_frame]
                    
                    # Detect pitch change points
                    pitch_changes = []
                    for j in range(1, len(segment_f0)-1):
                        if abs(segment_f0[j] - segment_f0[j-1]) > 20 and segment_conf[j] > 0.6:
                            pitch_changes.append(j)
                    
                    if pitch_changes:
                        # Split at change points
                        split_times = [note['start']]
                        for change in pitch_changes:
                            change_time = note['start'] + (change * hop_length / sr)
                            if change_time - split_times[-1] > 0.1:
                                split_times.append(change_time)
                        split_times.append(note['end'])
                        
                        # Create new notes
                        for k in range(len(split_times)-1):
                            new_start = split_times[k]
                            new_end = split_times[k+1]
                            new_dur = new_end - new_start
                            
                            # Only keep if duration is sufficient
                            if new_dur > 0.1:
                                # Get pitch for the segment
                                seg_start_frame = max(0, min(n_frames-1, int(new_start * sr / hop_length)))
                                seg_end_frame = max(0, min(n_frames, int(new_end * sr / hop_length)))
                                pitch_hz, _ = get_dominant_pitch(f0_smoothed, confidences, seg_start_frame, seg_end_frame)
                                
                                if pitch_hz:
                                    midi_num = librosa.hz_to_midi(pitch_hz)
                                    quantized_midi = round(midi_num)
                                    note_name = librosa.midi_to_note(quantized_midi, cents=False)
                                    
                                    # Volume for segment
                                    seg_rms = rms_energy[seg_start_frame:seg_end_frame]
                                    volume = int(np.interp(np.percentile(seg_rms, 75), 
                                                        [0.005, 0.3], [40, 127]))
                                    
                                    final_notes.append({
                                        "note": note_name,
                                        "start": round(new_start, 3),
                                        "end": round(new_end, 3),
                                        "duration": round(new_dur, 3),
                                        "volume": volume
                                    })
                    else:
                        final_notes.append(note)
                else:
                    final_notes.append(note)
            
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