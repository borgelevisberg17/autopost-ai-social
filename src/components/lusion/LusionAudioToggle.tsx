import { useState, useEffect } from "react";
import { lusionSound } from "./LusionAudio";

export function LusionAudioToggle() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(lusionSound.enabled);
  }, []);

  const handleToggle = () => {
    const newState = lusionSound.toggle();
    setActive(newState);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={active ? "Desativar áudio tátil Lusion" : "Ativar áudio tátil Lusion"}
      aria-label="Controle de áudio tátil"
      className={`group relative flex h-9 items-center gap-2 rounded-full border px-3 transition-all duration-300 ${
        active
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
          : "border-slate-200/80 bg-white/60 text-slate-500 hover:border-slate-300 hover:text-slate-800"
      }`}
    >
      <div className="flex items-center gap-0.5 h-3">
        <span
          className={`w-[2px] rounded-full transition-all duration-300 ${
            active
              ? "h-3 bg-emerald-500 animate-[pulse_0.7s_infinite_ease-in-out]"
              : "h-1 bg-slate-400 group-hover:bg-slate-600"
          }`}
        />
        <span
          className={`w-[2px] rounded-full transition-all duration-300 ${
            active
              ? "h-4 bg-emerald-500 animate-[pulse_0.5s_infinite_ease-in-out_0.2s]"
              : "h-2 bg-slate-400 group-hover:bg-slate-600"
          }`}
        />
        <span
          className={`w-[2px] rounded-full transition-all duration-300 ${
            active
              ? "h-2 bg-emerald-500 animate-[pulse_0.6s_infinite_ease-in-out_0.4s]"
              : "h-1.5 bg-slate-400 group-hover:bg-slate-600"
          }`}
        />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
        {active ? "SOM ON" : "SOM"}
      </span>
    </button>
  );
}
