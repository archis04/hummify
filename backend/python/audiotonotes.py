import librosa
import numpy as np
import argparse
import json
import tempfile
import requests
import os

parser = argparse.ArgumentParser()
parser.add_argument("audio_url", help="Cloudinary audio URL")
args = parser.parse_args()

try:
    # Step 1: Download the audio file to a temp file
    response = requests.get(args.audio_url)
    response.raise_for_status()

    # Save to a temporary file with correct extension (e.g. .webm, .wav)
    suffix = os.path.splitext(args.audio_url)[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
        temp_audio.write(response.content)
        temp_audio_path = temp_audio.name

    # Step 2: Load the local temp file with librosa
    y, sr = librosa.load(temp_audio_path)

    # Step 3: Onset detection and pitch analysis
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr, backtrack=True)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)
    onset_times = np.append(onset_times, librosa.get_duration(y=y, sr=sr))

    pitches = librosa.yin(y, fmin=librosa.note_to_hz('C2'),
                          fmax=librosa.note_to_hz('C7'), sr=sr)
    amplitudes = librosa.feature.rms(y=y)[0]
    frame_times = librosa.times_like(pitches)

    notes = []
    for i in range(len(onset_times) - 1):
        start = onset_times[i]
        end = onset_times[i + 1]
        duration = end - start

        mask = (frame_times >= start) & (frame_times < end)
        segment_pitches = pitches[mask]
        segment_amplitudes = amplitudes[mask]
        segment_pitches = segment_pitches[segment_pitches > 0]

        if len(segment_pitches) > 0:
            pitch_hz = np.median(segment_pitches)
            note_name = librosa.hz_to_note(pitch_hz)
            avg_amp = np.mean(segment_amplitudes)

            notes.append({
                "note": note_name,
                "start": round(start, 3),
                "end": round(end, 3),
                "duration": round(duration, 3),
                "volume": round(float(avg_amp), 3)*127
            })

    filtered_notes = [
        n for n in notes if n['duration'] >= 0.2 and n['volume'] >= 0.02
    ]

    print(json.dumps(filtered_notes))

    # Optional: Clean up temp file
    os.remove(temp_audio_path)

except Exception as e:
    print(json.dumps({"error": str(e)}))
