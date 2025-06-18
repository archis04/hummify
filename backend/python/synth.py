import sys
import json
import os
import subprocess
import pretty_midi
import librosa  # Added for cents conversion
import re
from midi2audio import FluidSynth

def check_fluidsynth_installation():
    try:
        subprocess.run(["fluidsynth", "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def check_soundfont(sf2_path):
    if not os.path.exists(sf2_path):
        print(f"Error: Soundfont file not found at {sf2_path}", file=sys.stderr)
        print("Please download FluidR3_GM.sf2 and place it in the backend/python directory", file=sys.stderr)
        return False
    return True 

def notes_to_midi(note_objs, midi_path, program, is_drum=False):
    try:
        pm = pretty_midi.PrettyMIDI()
        instr = pretty_midi.Instrument(program=program, is_drum=is_drum)
        print("Incoming note names:", [obj["note"] for obj in note_objs], file=sys.stderr)

        for obj in note_objs:
            raw_note = obj["note"]
            # Extract base note and cents (e.g., "C4+12" -> ("C4", 12))
            match = re.match(r"([A-Ga-g#♯b♭]+[0-9])([+-]\d+)", raw_note)
            if match:
                base_note = match.group(1)
                cents = int(match.group(2))
            else:
                base_note = raw_note
                cents = 0

            # Convert to MIDI pitch number
            try:
                pitch = pretty_midi.note_name_to_number(base_note)
            except ValueError:
                # Try alternative naming if standard conversion fails
                base_note = base_note.replace("♯", "#").replace("♭", "b")
                pitch = pretty_midi.note_name_to_number(base_note)
            
            # Apply cents adjustment (1 cent = 1/100 semitone)
            pitch += cents / 100.0
            
            start, end = obj["start"], obj["end"]
            volume = obj.get("volume", 100)
            velocity = max(1, min(127, int(volume)))
            
            print(f"Processing note: {base_note}{cents:+} -> {pitch:.2f}, "
                  f"start: {start}, end: {end}, velocity: {velocity}", file=sys.stderr)

            note = pretty_midi.Note(
                velocity=velocity,
                pitch=int(round(pitch)),  # Round to nearest integer for MIDI
                start=start,
                end=end
            )
            instr.notes.append(note)

        pm.instruments.append(instr)
        pm.write(midi_path)
        print(f"Successfully wrote MIDI file to {midi_path}", file=sys.stderr)
    except Exception as e:
        print(f"Error in notes_to_midi: {str(e)}", file=sys.stderr)
        raise

def synthesize_audio(midi_path, wav_path):
    try:
        if not check_fluidsynth_installation():
            raise RuntimeError("FluidSynth is not installed. Please install it first.")

        sf2_path = os.path.join(os.path.dirname(__file__), "FluidR3_GM.sf2")
        if not check_soundfont(sf2_path):
            raise FileNotFoundError(f"Soundfont file not found at {sf2_path}")

        print(f"Using soundfont at: {sf2_path}", file=sys.stderr)
        print(f"Converting MIDI to WAV: {midi_path} -> {wav_path}", file=sys.stderr)
        
        try:
            fs = FluidSynth(sf2_path, sample_rate=44100)
            fs.midi_to_audio(midi_path, wav_path)
                
            if not os.path.exists(wav_path):
                raise FileNotFoundError("WAV file was not created by FluidSynth")
                
        except subprocess.TimeoutExpired:
            print("FluidSynth process timed out after 30 seconds", file=sys.stderr)
            raise
        except subprocess.CalledProcessError as e:
            print(f"FluidSynth error: {e.stderr}", file=sys.stderr)
            raise
            
    except Exception as e:
        print(f"Error in synthesize_audio: {str(e)}", file=sys.stderr)
        raise

if __name__ == "__main__":
    try:
        print("Python script started", file=sys.stderr)
        instrument_arg = sys.argv[1] if len(sys.argv) > 1 else "Acoustic Grand Piano"
        is_drum = instrument_arg.lower() in ["drum", "drums", "percussion", "drum kit"]
        program = 0 if is_drum else pretty_midi.instrument_name_to_program(instrument_arg.title())
        print(f"Using instrument: {instrument_arg} (program: {program}, is_drum: {is_drum})", file=sys.stderr)

        # Read input notes from stdin
        stdin_data = sys.stdin.read()
        data = json.loads(stdin_data)

        output_dir = "uploads"
        os.makedirs(output_dir, exist_ok=True)

        midi_path = os.path.join(output_dir, "output.mid")
        wav_path = os.path.join(output_dir, "output.wav")

        notes_to_midi(data, midi_path, program, is_drum)
        synthesize_audio(midi_path, wav_path)

        # Only output JSON to stdout
        print(json.dumps({"status": "success", "message": "Audio synthesized successfully"}))
        sys.exit(0)
    except Exception as e:
        # Only output JSON to stdout
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)