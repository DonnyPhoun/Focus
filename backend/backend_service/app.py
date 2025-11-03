import os, uuid, subprocess, shutil, glob
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- Paths (match your repo layout) ---
BASE_DIR   = Path(__file__).resolve().parent
BACKEND = BASE_DIR.parent
MT_DIR     = BACKEND / "MusicTransformer-Pytorch"       # where generate.py lives
LOFI_DIR   = BACKEND/ "LofiFiltering"
LOFI_OUT   = LOFI_DIR / "lofi_songs"                     # generate_lofi.py writes here
MEDIA_DIR  = BACKEND / "media"                          # public files served to frontend

MT_SCRIPT  = MT_DIR / "generate.py"
LOFI_SCRIPT= LOFI_DIR / "generate_lofi.py"

MEDIA_DIR.mkdir(parents=True, exist_ok=True)
LOFI_OUT.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def run_music_transformer():
    """
    Run your exact MT command inside backend/MusicTransformer-Pytorch.
    This generates songs/rand.mid (as your script currently does).
    """
    cmd = [
        "python3", str(MT_SCRIPT),
        "-output_dir", "songs",
        "-model_weights", "training_output/results/best_loss_weights.pickle",
        "--rpr",
        "-max_sequence", "1024",
        "-d_model", "256",
        "-n_layers", "6",
        "-num_heads", "8",
        "-midi_root", "./preprocessed_data"
    ]
    subprocess.run(cmd, check=True, cwd=str(MT_DIR))

def newest_file(dir_glob: str) -> Path | None:
    files = glob.glob(dir_glob)
    if not files:
        return None
    files.sort(key=os.path.getmtime)
    return Path(files[-1])

def run_lofi_filter() -> Path:
    """
    Run your lo-fi pipeline (no args; uses hardcoded paths inside the script).
    The script prints the final MP3 path; we’ll also pick the newest MP3 just in case.
    """
    cp = subprocess.run(
        ["python3", str(LOFI_SCRIPT)],
        check=True,
        cwd=str(BASE_DIR),
        text=True,
        capture_output=True
    )
    # Try to read the last printed line as an absolute mp3 path (your script prints it).
    last_line = cp.stdout.strip().splitlines()[-1] if cp.stdout.strip().splitlines() else ""
    candidate = Path(last_line)
    if candidate.suffix.lower() == ".mp3" and candidate.exists():
        return candidate

    # Fallback: newest MP3 in lofi_songs
    mp3 = newest_file(str(LOFI_OUT / "*.mp3"))
    if not mp3 or not mp3.exists():
        raise RuntimeError("No MP3 produced by lo-fi filter.")
    return mp3

@app.route("/api/generate", methods=["POST"])
def generate():
    # prompt accepted for future use; your current generator ignores it
    _ = (request.get_json(silent=True) or {}).get("prompt", "")

    try:
        # 1) Generate rand.mid with your MusicTransformer
        run_music_transformer()

        # 2) Convert to lo-fi MP3
        mp3_src = run_lofi_filter()

        # 3) Copy into public media as a unique name
        uid = uuid.uuid4().hex
        mp3_dst = MEDIA_DIR / f"{uid}.mp3"
        shutil.copyfile(mp3_src, mp3_dst)

        return jsonify({"audioUrl": f"/media/{mp3_dst.name}", "id": uid})
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Subprocess failed: {e}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/media/<path:filename>", methods=["GET"])
def serve_media(filename):
    return send_from_directory(MEDIA_DIR, filename, as_attachment=False)

if __name__ == "__main__":
    # Use a port different from Vite's 5173
    app.run(host="127.0.0.1", port=5001, debug=True)
