import sys
import pretty_midi
import os
import time
import subprocess

def synthesize(notes, output_path, soundfont_path):
    # Create a PrettyMIDI object
    midi = pretty_midi.PrettyMIDI()
    instrument = pretty_midi.Instrument(program=0)  # Acoustic Grand Piano

    start = 0
    duration = 0.5  # half second per note

    for note_name in notes:
        try:
            pitch = pretty_midi.note_name_to_number(note_name)
            note = pretty_midi.Note(velocity=100, pitch=pitch, start=start, end=start + duration)
            instrument.notes.append(note)
            start += duration
        except:
            continue  # skip invalid note

    midi.instruments.append(instrument)

    temp_midi_path = "temp.mid"
    midi.write(temp_midi_path)

    # Call fluidsynth CLI to render MIDI to WAV
    subprocess.run([
        "fluidsynth",
        "-ni",  # no shell, no interactive
        soundfont_path,
        temp_midi_path,
        "-F", output_path,  # output WAV file path
        "-r", "44100"      # sample rate
    ], check=True)

    # Remove temporary MIDI file
    os.remove(temp_midi_path)


if __name__ == "__main__":
    # Get notes from CLI arguments: ["C4", "E4", "G4"]
    notes = sys.argv[1].split(",")  # comma-separated
    timestamp = int(time.time())
    output_wav = f"output_{timestamp}.wav"

    sf2 = r"C:\Soundfont\FluidR3_GM.sf2"  # your .sf2 soundfont path (raw string)

    synthesize(notes, output_wav, sf2)
    print(output_wav)  # return path to Node.js
