import React, { useEffect, useRef, useState } from "react";
import libraryBg from "./assets/library.jpg";  // adjust path if needed
import CountdownTimer from "./CountdownTimer";
import ProfilePicture from "./ProfilePicture";
import profilePic from "./assets/example.jpg";
import avatarCoolGirl from "./assets/example2.webp";
import avatarCoolGuy from "./assets/example3.png";
import avatarAnimeGirl from "./assets/example4.jpg";

const PROFILE_OPTIONS = [
  profilePic,
  avatarCoolGirl,
  avatarCoolGuy,
  avatarAnimeGirl,
];

// --- Helper: make initials from a name ---
function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

// --- Mock peers for now (replace later with realtime presence) ---
const MOCK_PEERS = [
  { id: "p1", name: "Ava Chen", profilePic: avatarAnimeGirl},
  { id: "p2", name: "Diego S.", profilePic: avatarCoolGuy},
  { id: "p3", name: "Maya R.", profilePic: avatarCoolGirl },
  { id: "p4", name: "Samir K.", profilePic },
  { id: "p5", name: "Liam P." },
  { id: "p6", name: "Noah F.", profilePic: avatarAnimeGirl },
];

export default function Focus() {
  const [profileImage, setProfileImage] = useState(PROFILE_OPTIONS[0]);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [error, setError] = useState("");
  const [audioOn, setAudioOn] = useState(false);
  const [volume, setVolume] = useState(0.25);

  // NEW: generation state + last track url
  const [genLoading, setGenLoading] = useState(false);
  const [trackUrl, setTrackUrl] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

  // Load saved name and profile picture
  useEffect(() => {
    const savedName = localStorage.getItem("focus:name") || "";
    const savedImage = localStorage.getItem("focus:profileImage");
    if (savedName) setDisplayName(savedName);
    else setEditingName(true);
    if (savedImage !== null){
      setProfileImage(savedImage === 'null' ? null : savedImage);
    }
  }, []);

  // Setup audio element (no default src; we’ll set src after generation)
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // --- Generation: ask backend for a new track and play it
  const requestNewTrack = async () => {
    setError("");
    setGenLoading(true);
    try {
      
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "chill lofi piano" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate");

      const url = data.audioUrl; // e.g., /media/<uuid>.mp3
      setTrackUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
        setAudioOn(true);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "Generation failed.");
      setAudioOn(false);
    } finally {
      setGenLoading(false);
    }
  };

  const toggleAudio = async () => {
    setError("");
    try {
      if (!audioRef.current) return;

      // If no track yet, generate one
      if (!trackUrl) {
        await requestNewTrack();
        return;
      }

      if (audioOn) {
        audioRef.current.pause();
        setAudioOn(false);
      } else {
        await audioRef.current.play();
        setAudioOn(true);
      }
    } catch (e) {
      console.error(e);
      setError("Autoplay blocked. Tap play again to start music.");
    }
  };

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
      setCamOn(true);
    } catch (e) {
      console.error(e);
      setError("Could not access camera. Check browser permissions.");
    }
  };

  const stopCamera = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  };

  const toggleCamera = () => (camOn ? stopCamera() : startCamera());

  const saveName = () => {
    const n = displayName.trim();
    if (!n) return;
    localStorage.setItem("focus:name", n);
    localStorage.setItem("focus:profileImage", profileImage === null ? 'null' : profileImage);
    setEditingName(false);
  };

  return (
    <div className="relative min-h-screen w-full text-white">
      {/* Background */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${libraryBg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/60" aria-hidden />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center font-bold">
            FUS
          </div>
          <h1 className="text-xl font-semibold tracking-wide">FocUS</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/20 transition"
            onClick={() => setEditingName(true)}
          >
            {displayName ? `@${displayName}` : "Set display name"}
          </button>

          {/* NEW: Generate a fresh track */}
          <button
            className={`rounded-xl px-3 py-2 transition ${
              genLoading ? "bg-white/20" : "bg-indigo-500/80 hover:bg-indigo-500"
            }`}
            onClick={requestNewTrack}
            disabled={genLoading}
            title="Generate a new lofi track"
          >
            {genLoading ? "…Generating" : "New Track"}
          </button>

          {/* Play/Pause the current track */}
          <button
            className={`rounded-xl px-3 py-2 transition ${
              audioOn ? "bg-emerald-500/80 hover:bg-emerald-500" : "bg-white/10 hover:bg-white/20"
            }`}
            onClick={toggleAudio}
            title="Toggle lofi"
          >
            {audioOn ? "⏸ Lofi" : trackUrl ? "▶️ Lofi" : "▶️ Play"}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-28 accent-white/90"
            title="Volume"
          />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 w-full px-6 pb-16">
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Your tile */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 shadow-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">You</h2>
                <div className="flex items-center gap-2"></div>
              </div>

              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/40 flex items-center justify-center">
                {camOn ? (
                  <video 
                    ref={videoRef} 
                    className="h-full w-full object-cover" 
                    muted 
                    playsInline
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt={`${initials(displayName)}`}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-white/10 grid place-items-center text-2xl font-bold">
                        {displayName ? initials(displayName) : "?"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Timer card */}
            <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur p-4 shadow-xl border border-white/10">
              <CountdownTimer initialTimeInSeconds={1500} /> {/* 25 minutes */}
            </div>
          </div>

          {/* Right: The room grid (mock peers) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 shadow-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Main Room · Library</h2>
                <div className="text-sm text-white/80">
                  {MOCK_PEERS.length + 1} people here</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Your tile (mirrored as presence) */}
                <PresenceTile 
                  name={displayName || "You"} 
                  active={camOn}
                  profilePic={profileImage} />
                {MOCK_PEERS.map((p) => (
                  <PresenceTile key={p.id} name={p.name} active={false} profilePic={p.profilePic}/>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur p-4 shadow-xl border border-white/10">
              <h3 className="text-base font-semibold mb-2">How it works (MVP)</h3>
              <ul className="list-disc pl-5 space-y-1 text-white/85 text-sm">
                <li>Set a display name and (optionally) turn on your camera.</li>
                <li>Generate a new track or play/pause the current one from the top bar.</li>
                <li>Other users are mocked for now. Realtime presence & rooms come next.</li>
              </ul>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl bg-rose-600/80 px-4 py-3 text-sm">{error}</div>
        )}
      </main>

      {/* Name modal */}
      {editingName && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white text-neutral-900 shadow-2xl p-5">
            <h2 className="text-lg font-semibold mb-2">Choose your display name and avatar</h2>
            <p className="text-sm text-neutral-600 mb-2">Select an Avatar:</p>
            {/* Avatar Selection Grid */}
            <div className="flex gap-3 justify-center mb-4">
              {PROFILE_OPTIONS.map((url, index) => (
                <div 
                  key={index}
                  className={`w-14 h-14 rounded-full overflow-hidden cursor-pointer transition-all ${
                    profileImage === url
                      ? 'ring-4 ring-neutral-900 ring-offset-2 ring-offset-white' 
                      : 'hover:ring-2 hover:ring-neutral-400'
                  }`}
                  onClick={() => {
                    setProfileImage(url);
                  }}
                >
                  {url ? (
                    <img src={url} alt={`Avatar option ${index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-300 grid place-items-center text-neutral-900 font-bold text-xl">
                      ?
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Changing Display Name */}
            <input
              className="w-full rounded-xl border border-neutral-300 bg-black/1000 
                        px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/70 
                        text-white placeholder:text-neutral-400"
              placeholder="e.g., Donald P."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="rounded-xl px-4 py-2 bg-neutral-200 hover:bg-neutral-300"
                onClick={() => setEditingName(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-xl px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800"
                onClick={saveName}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 px-6 pb-6 text-sm text-white/70">
        Built as an MVP for study accountability. Privacy-first: camera is off by default.
      </footer>
    </div>
  );
}

function PresenceTile({ name, active, profilePic }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/40 flex items-center justify-center relative">
      {active ? (
        <div className="absolute inset-0 grid place-items-center text-sm text-white/80">
          <span>\u25CF Live</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          {/* Check if photo for profile, else display initials */}
          {profilePic ? (
            <img
              src={profilePic}
              alt={`${name}'s profile`}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-white/10 grid place-items-center text-lg font-bold">
              {initials(name) || "?"}
            </div>
          )}
          <p className="text-xs text-white/80">{name}</p>
        </div>
      )}
    </div>
  );
}
