import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

export default function AudioPlayer({ src, title }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm">
      <button onClick={toggle} className="w-11 h-11 shrink-0 rounded-full bg-rosa-500 text-white flex items-center justify-center">
        {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-bold text-malva-700 truncate">{title}</p>}
        <div className="h-2 bg-rosa-100 rounded-full cursor-pointer mt-1" onClick={seek}>
          <div className="h-full bg-rosa-400 rounded-full" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
        </div>
        <div className="flex justify-between text-xs text-malva-400 mt-0.5">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
