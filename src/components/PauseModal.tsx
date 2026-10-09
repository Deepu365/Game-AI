import React from 'react';
import { GameStats, Difficulty } from '../game/types';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

interface PauseModalProps {
  stats: GameStats;
  difficulty: Difficulty;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  stats,
  difficulty,
  isMuted,
  onResume,
  onRestart,
  onQuit,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,240,255,0.2)] flex flex-col gap-5 text-slate-100">
        <div className="text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
            Engine Disengaged
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Chakra_Petch']">
            RACE PAUSED
          </h2>
        </div>

        {/* Current Run Metrics */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 bg-slate-900/60 rounded">
            <span className="text-slate-400 block text-[10px] uppercase">Score</span>
            <span className="text-base font-bold text-white tabular-nums">
              {Math.floor(stats.score).toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-slate-900/60 rounded">
            <span className="text-slate-400 block text-[10px] uppercase">Distance</span>
            <span className="text-base font-bold text-slate-200 tabular-nums">
              {Math.floor(stats.distance).toLocaleString()} m
            </span>
          </div>
          <div className="p-2 bg-slate-900/60 rounded">
            <span className="text-slate-400 block text-[10px] uppercase">Coins</span>
            <span className="text-base font-bold text-amber-400 tabular-nums">
              {stats.coins}
            </span>
          </div>
          <div className="p-2 bg-slate-900/60 rounded">
            <span className="text-slate-400 block text-[10px] uppercase">Protocol</span>
            <span className="text-base font-bold text-cyan-400 uppercase">
              {difficulty}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onResume}
            type="button"
            className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME RACE [P]</span>
          </button>

          <button
            onClick={onRestart}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-mono text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RACE</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onToggleMute}
              type="button"
              className="py-2.5 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
            </button>

            <button
              onClick={onQuit}
              type="button"
              className="py-2.5 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
