import sys
import json
import os
import subprocess
import pretty_midi
import re
import numpy as np

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
        # Sort notes by start time to ensure proper sequencing
        note_objs = sorted(note_objs, key=lambda x: x["start"])
        
        # Pre-calculate tempo based on note density
        avg_note_duration = np.mean([n["duration"] for n in note_objs])
        tempo = max(40, min(180, int(120 / (avg_note_duration + 0.1))))
        print(f"Using tempo: {tempo} BPM", file=sys.stderr)

        # Create PrettyMIDI object with initial tempo
        pm = pretty_midi.PrettyMIDI(initial_tempo=tempo)
        instr = pretty_midi.Instrument(program=program, is_drum=is_drum)

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
            
            # Humming-specific volume boost
            if velocity < 80:
                velocity = min(127, int(velocity * 1.4))
            
            print(f"Processing note: {base_note}{cents:+} -> {pitch:.2f}, "
                  f"start: {start:.3f}, end: {end:.3f}, velocity: {velocity}", file=sys.stderr)

            note = pretty_midi.Note(
                velocity=velocity,
                pitch=int(round(pitch)),  # Round to nearest integer for MIDI
                start=start,
                end=end
            )
            instr.notes.append(note)
            
            # Add vibrato effect if detected
            if obj.get("vibrato", False) and not is_drum:
                # Add modulation controller (CC#1)
                mod_time = start + (end - start) * 0.3
                mod_depth = min(127, int(velocity * 0.8))
                mod_event = pretty_midi.ControlChange(
                    number=1,
                    value=mod_depth,
                    time=mod_time
                )
                instr.control_changes.append(mod_event)

        pm.instruments.append(instr)
        pm.write(midi_path)
        print(f"Successfully wrote MIDI file to {midi_path}", file=sys.stderr)
        return tempo
    except Exception as e:
        print(f"Error in notes_to_midi: {str(e)}", file=sys.stderr)
        raise

def synthesize_audio(midi_path, wav_path, tempo):
    try:
        if not check_fluidsynth_installation():
            raise RuntimeError("FluidSynth is not installed. Please install it first.")

        sf2_path = os.path.join(os.path.dirname(__file__), "FluidR3_GM.sf2")
        if not check_soundfont(sf2_path):
            raise FileNotFoundError(f"Soundfont file not found at {sf2_path}")

        print(f"Using soundfont at: {sf2_path}", file=sys.stderr)
        print(f"Converting MIDI to WAV: {midi_path} -> {wav_path}", file=sys.stderr)
        
        # Calculate render time buffer (duration + 20%)
        midi_duration = pretty_midi.PrettyMIDI(midi_path).get_end_time()
        timeout = max(30, int(midi_duration * 1.2))
        
        # FluidSynth configuration for humming conversion
        command = [
            "fluidsynth", 
            "-F", wav_path,
            "-r", "44100",
            "-g", "0.8",           # Gain adjustment
            "-C", "0",              # Disable chorus
            "-R", "0",              # Disable reverb
            "-T", "wav",
            sf2_path,
            midi_path
        ]
        
        try:
            # Redirect FluidSynth output to stderr to keep stdout clean
            process = subprocess.run(
                command, 
                check=True, 
                timeout=timeout,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
            # Print FluidSynth output to stderr for debugging
            print("FluidSynth output:", file=sys.stderr)
            print(process.stdout, file=sys.stderr)
                
            if not os.path.exists(wav_path):
                raise FileNotFoundError("WAV file was not created by FluidSynth")
                
        except subprocess.TimeoutExpired as e:
            print(f"FluidSynth process timed out: {e.stdout}", file=sys.stderr)
            raise
        except subprocess.CalledProcessError as e:
            print(f"FluidSynth error: {e.stdout}", file=sys.stderr)
            raise
            
    except Exception as e:
        print(f"Error in synthesize_audio: {str(e)}", file=sys.stderr)
        raise

def post_process_audio(input_path, output_path):
    """Apply EQ and compression to enhance instrument sound"""
    try:
        command = [
            "ffmpeg", "-y", "-i", input_path,
            "-af", "aformat=sample_fmts=s16:channel_layouts=mono,"
                    "equalizer=f=1000:width_type=h:width=2000:g=5,"
                    "compand=attacks=0.1:decays=0.4:points=-80/-80|-30/-10|0/0",
            "-ar", "44100",
            output_path
        ]
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        print(f"Audio post-processing failed: {str(e)}", file=sys.stderr)
        # Use original if processing fails
        os.replace(input_path, output_path)

if __name__ == "__main__":
    try:
        print("Python script started", file=sys.stderr)
        instrument_arg = sys.argv[1] if len(sys.argv) > 1 else "Acoustic Grand Piano"
        is_drum = instrument_arg.lower() in ["drum", "drums", "percussion", "drum kit"]
        
        # Humming-optimized instrument mapping
        instrument_map = {
            "violin": 40,
            "cello": 42,
            "flute": 73,
            "trumpet": 56,
            "clarinet": 71,
            "oboe": 68,
            "sax": 66,
            "piano": 0,
            "guitar": 24,
            "harmonica": 22
        }
        
        if instrument_arg.lower() in instrument_map:
            program = instrument_map[instrument_arg.lower()]
        else:
            program = 0 if is_drum else pretty_midi.instrument_name_to_program(instrument_arg.title())
        
        print(f"Using instrument: {instrument_arg} (program: {program}, is_drum: {is_drum})", file=sys.stderr)

        # Read input notes from stdin
        stdin_data = sys.stdin.read()
        data = json.loads(stdin_data)
        
        # Handle analysis pipeline output format
        if "analysis" in data:
            note_objs = data["analysis"]
        elif "error" in data:
            raise RuntimeError(f"Analysis error: {data['error']}")
        else:
            note_objs = data

        output_dir = "uploads"
        os.makedirs(output_dir, exist_ok=True)

        midi_path = os.path.join(output_dir, "output.mid")
        raw_wav_path = os.path.join(output_dir, "raw_output.wav")
        final_wav_path = os.path.join(output_dir, "output.wav")

        tempo = notes_to_midi(note_objs, midi_path, program, is_drum)
        synthesize_audio(midi_path, raw_wav_path, tempo)
        post_process_audio(raw_wav_path, final_wav_path)

        # Clean up temporary files
        if os.path.exists(raw_wav_path):
            os.remove(raw_wav_path)

        # Only print JSON to stdout at the very end
        print(json.dumps({
            "status": "success",
            "message": "Audio synthesized successfully",
            "tempo": tempo,
            "output_file": final_wav_path
        }))
        
    except Exception as e:
        # Only print JSON to stdout for errors too
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)