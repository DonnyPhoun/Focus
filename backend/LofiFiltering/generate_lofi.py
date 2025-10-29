import subprocess
import os
import sys
import uuid

# --------- Config ---------
SOUNDFONT_PATH = "CTK-230_SoundFont.sf2"  # <-- Replace with your .sf2 path
MIDI_INPUT = "rand.mid"                # <-- Replace with your .mid file
OUTPUT_DIR = "lofi_songs"                  # You can change this
# --------------------------

# Create output folder
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Generate unique ID to avoid conflicts
song_id = str(uuid.uuid4())
wav_file = os.path.join(OUTPUT_DIR, f"{song_id}.wav")
filtered_wav = os.path.join(OUTPUT_DIR, f"{song_id}_lofi.wav")
mp3_file = os.path.join(OUTPUT_DIR, f"{song_id}_lofi.mp3")

if not os.path.exists(SOUNDFONT_PATH):
    print(f"❌ SoundFont not found at: {SOUNDFONT_PATH}")
    sys.exit(1)


# Step 1: MIDI → WAV with FluidSynth (corrected order)
print("🎹 Rendering MIDI to WAV with FluidSynth...")
subprocess.run([
    "fluidsynth",
    "-F", wav_file,            # Output file
    SOUNDFONT_PATH,            # SoundFont
    MIDI_INPUT                 # MIDI file
], check=True)


# Step 2: Apply lo-fi filters with ffmpeg
print("🎧 Applying lo-fi filtering with ffmpeg...")
subprocess.run([
    "ffmpeg",
    "-y",
    "-i", wav_file,
    "-af", "aresample=8000,lowpass=f=3000,highpass=f=100,volume=0.8",
    filtered_wav
], check=True)

# Step 3: Convert to MP3
print("🎶 Converting to MP3...")
subprocess.run([
    "ffmpeg",
    "-y",
    "-i", filtered_wav,
    "-codec:a", "libmp3lame",
    "-qscale:a", "4",
    mp3_file
], check=True)

print(f"✅ Done! MP3 saved at: {mp3_file}")
