import librosa
import numpy as np
import argparse
import json
import tempfile
import requests
import os
import subprocess
from scipy.ndimage import median_filter

# Argument parser for audio URL
parser = argparse.ArgumentParser()
parser.add_argument("audio_url", help="Cloudinary audio URL")
args = parser.parse_args()

try:
    # Download audio with streaming and timeout
    response = requests.get(args.audio_url, stream=True, timeout=10)
    response.raise_for_status()
    
    # Temporary directory for processing
    with tempfile.TemporaryDirectory() as tmpdir:
        ext = os.path.splitext(args.audio_url)[1] or ".webm"
        input_path = os.path.join(tmpdir, f"input{ext}")
        output_path = os.path.join(tmpdir, "converted.wav")
        
        # Save audio
        with open(input_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Convert to WAV (mono, 44.1kHz, 16-bit PCM)
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path,
            "-ac", "1", "-ar", "44100", "-acodec", "pcm_s16le",
            output_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Load audio
        y, sr = librosa.load(output_path, sr=None, mono=True)
        y = librosa.util.normalize(y)

        # Analysis parameters
        hop_length = 256  # Reduced for finer resolution
        frame_length = 2048
        
        # Onset detection with refined parameters
        onset_env = librosa.onset.onset_strength(
            y=y, sr=sr, hop_length=hop_length, aggregate=np.median,
            n_fft=2048, lag=2, max_size=3
        )
        delta = 0.08 * np.median(onset_env)  # Lower threshold for sensitivity
        onset_frames = librosa.onset.onset_detect(
            onset_envelope=onset_env,
            sr=sr,
            hop_length=hop_length,
            backtrack=True,
            units='frames',
            delta=delta,
            wait=8  # ~36ms for faster transitions
        )
        onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)
        
        # Pitch detection with PYIN
        f0, voiced_flag, voiced_probs = librosa.pyin(
            y,
            fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7'),
            sr=sr,
            frame_length=frame_length,
            hop_length=hop_length,
            fill_na=0,
            center=True,
            resolution=0.1  # Finer pitch resolution
        )
        
        # Smooth pitch
        f0_smoothed = median_filter(f0, size=5)
        frame_times = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=hop_length)
        
        # RMS energy
        amplitudes = librosa.feature.rms(
            y=y, frame_length=frame_length, hop_length=hop_length, center=True
        )[0]
        
        # Silence threshold
        silence_threshold = np.percentile(amplitudes, 10)  # Lowered for sensitivity
        
        # End time of last note
        voiced_mask_all = (voiced_probs > 0.4) & (amplitudes > silence_threshold)
        if np.any(voiced_mask_all):
            last_frame = np.max(np.where(voiced_mask_all))
            last_time = frame_times[last_frame]
        else:
            last_time = frame_times[-1]
        onset_times = np.append(onset_times, last_time)
        
        # Process note segments
        notes = []
        for i in range(len(onset_times) - 1):
            start = onset_times[i]
            end = onset_times[i+1]
            duration = end - start
            
            if duration < 0.1:  # Stricter minimum duration
                continue
                
            mask = (frame_times >= start) & (frame_times < end)
            segment_f0 = f0_smoothed[mask]
            segment_amps = amplitudes[mask]
            segment_voiced_probs = voiced_probs[mask]
            
            voiced_mask = (segment_voiced_probs > 0.4) & (segment_amps > silence_threshold)
            segment_f0 = segment_f0[voiced_mask]
            segment_amps = segment_amps[voiced_mask]
            segment_voiced_probs = segment_voiced_probs[voiced_mask]
            
            if len(segment_f0) < 10:  # Require more voiced frames
                continue
                
            weights = segment_voiced_probs * segment_amps
            pitch_hz = np.average(segment_f0, weights=weights)
            if pitch_hz <= 0:
                continue
                
            note_name = librosa.hz_to_note(pitch_hz, cents=False)  # No cents
            
            # Logarithmic volume scaling
            amp_75 = np.percentile(segment_amps, 75)
            if amp_75 > silence_threshold:
                log_amp = np.log1p((amp_75 - silence_threshold) / (np.max(amplitudes) - silence_threshold))
                volume = int(np.interp(log_amp, [0, np.log1p(1)], [40, 127]))  # Boosted range
            else:
                volume = 40
                
            notes.append({
                "note": note_name,
                "start": round(start, 2),
                "end": round(end, 2),
                "duration": round(duration, 2),
                "volume": volume
            })
        
        # Consolidate consecutive notes
        consolidated_notes = []
        for note in notes:
            if (consolidated_notes and 
                consolidated_notes[-1]["note"] == note["note"] and
                note["start"] - consolidated_notes[-1]["end"] < 0.05):  # Merge if gap < 50ms
                consolidated_notes[-1]["end"] = note["end"]
                consolidated_notes[-1]["duration"] = round(consolidated_notes[-1]["end"] - consolidated_notes[-1]["start"], 2)
                consolidated_notes[-1]["volume"] = max(consolidated_notes[-1]["volume"], note["volume"])
            else:
                consolidated_notes.append(note)
        
        # Output JSON
        print(json.dumps(consolidated_notes, indent=2))

except Exception as e:
    print(json.dumps({"error": str(e)}, indent=2))
    exit(1)