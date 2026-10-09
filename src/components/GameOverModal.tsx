import React from 'react';
import { GameStats, Difficulty, HighScoreRecord, Pilot } from '../game/types';
import { RotateCcw, Trophy, Sparkles, Home, Gauge, Zap, Coins } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  difficulty: Difficulty;
  pilot: Pilot;
  highScoreRecord: HighScoreRecord;
  isNewHighScore: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  difficulty,
  pilot,
  highScoreRecord,
  isNewHighScore,
  onRestart,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(255,0,85,0.25)] flex flex-col gap-5 text-slate-100 my-auto">
        {/* Header */}
        <div className="text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-rose-400 mb-1 flex items-center justify-center gap-2">
            <span>{pilot.badgeEmoji}</span>
            <span>PILOT {pilot.name.toUpperCase()} // INTEGRITY COMPROMISED</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-['Chakra_Petch']">
            RACE TERMINATED
          </h2>

          {isNewHighScore && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-mono font-bold animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>NEW HIGH SCORE RECORD ACHIEVED!</span>
            </div>
          )}
        </div>

        {/* Primary Final Score Display */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Final Score
          </span>
          <div className="text-4xl sm:text-5xl font-black font-mono text-cyan-400 tracking-tight mt-0.5 tabular-nums drop-shadow-[0_0_12px_rgba(0,240,255,0.5)]">
            {Math.floor(stats.score).toLocaleString()}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1 flex items-center justify-center gap-3">
            <span>Pilot: <strong className="text-white">{pilot.name}</strong></span>
            <span>·</span>
            <span>Protocol: <strong className="text-slate-200 uppercase">{difficulty}</strong></span>
            <span>·</span>
            <span>Multiplier: <strong className="text-slate-200">{difficulty === 'easy' ? '1.0x' : difficulty === 'medium' ? '1.4x' : '2.0x'}</strong></span>
          </div>
        </div>

        {/* Detailed Performance Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase">Distance</span>
            <span className="text-base font-bold text-white tabular-nums">
              {stats.distance >= 1000
                ? `${(stats.distance / 1000).toFixed(2)} km`
                : `${Math.floor(stats.distance)} m`}
            </span>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase">Credits</span>
            <span className="text-base font-bold text-amber-400 tabular-nums flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              {stats.coins}
            </span>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase">Starlight Gems</span>
            <span className="text-base font-bold text-pink-400 tabular-nums flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {stats.gems || 0}
            </span>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase">Overtakes</span>
            <span className="text-base font-bold text-emerald-400 tabular-nums">
              {stats.overtakes}
            </span>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase">Near Misses</span>
            <span className="text-base font-bold text-cyan-400 tabular-nums">
              {stats.nearMisses}
            </span>
          </div>

          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase">Top Record</span>
            <span className="text-base font-bold text-slate-300 tabular-nums flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              {highScoreRecord.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onRestart}
            type="button"
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:via-purple-500 hover:to-cyan-400 text-white font-bold font-['Chakra_Petch'] text-base tracking-wider flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98] shadow-[0_0_25px_rgba(255,42,133,0.35)] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onMainMenu}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-mono text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>PILOT SELECTION / MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
