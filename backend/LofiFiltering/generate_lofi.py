import subprocess
import os
import sys
import uuid
from pathlib import Path

# Hardcoded Paths 
BASE_DIR = Path(__file__).resolve().parent
SOUNDFONT_PATH = BASE_DIR / "soundfonts" / "undertale.sf2"
MIDI_INPUT     = BASE_DIR.parent / "MusicTransformer-Pytorch" / "songs" / "rand.mid"
OUTPUT_DIR     = BASE_DIR / "lofi_songs"

def main():
    # Prep
    out_dir = Path(OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    sf2 = Path(SOUNDFONT_PATH)
    mid = Path(MIDI_INPUT)

    # Unique filenames per run
    song_id      = uuid.uuid4().hex # Make random Universally unique ID for song
    wav_file     = out_dir / f"{song_id}.wav"
    filtered_wav = out_dir / f"{song_id}_lofi.wav"
    mp3_file     = out_dir / f"{song_id}_lofi.mp3"

    try:
        print("🎹 Rendering MIDI to WAV with FluidSynth...", flush=True)
        # fluidsynth -F <out.wav> <soundfont.sf2> <input.mid>
        # -F, Render MIDI file into raw audio data and store in file (wav)
        # Use soundfont (undertale) and MIDI file
        subprocess.run([
            "fluidsynth",
            "-F", str(wav_file), 
            str(sf2),
            str(mid)
        ], check=True)

        print("🎧 Applying lo-fi filtering with ffmpeg...", flush=True)
        subprocess.run([
            "ffmpeg",
            "-y",
            "-i", str(wav_file),
            "-af", "aresample=8000,lowpass=f=3000,highpass=f=100,volume=0.8", # Lofi Filtering
            str(filtered_wav)
        ], check=True)

        print("🎶 Converting to MP3...", flush=True)
        subprocess.run([
            "ffmpeg",
            "-y", # Overwrite output files, takes away prompting issue
            "-i", str(filtered_wav), #infile 
            "-codec:a", "libmp3lame", # basic audio codec
            "-qscale:a", "4", # for quality, 0 - 9, where lower is better. Choose middle for now
            str(mp3_file) # output file
        ], check=True)

        # Print the absolute path so callers can capture it easily
        print(str(mp3_file.resolve()))
    except subprocess.CalledProcessError as e:
        fail(f"Processing failed: {e}")

if __name__ == "__main__":
    main()
