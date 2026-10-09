import React from 'react';
import { Difficulty, HighScoreRecord, Pilot } from '../game/types';
import { PILOTS } from '../game/pilots';
import { Play, Volume2, VolumeX, Trophy, Cpu, Compass, Sparkles, Heart, Zap } from 'lucide-react';

interface StartScreenProps {
  onStart: (difficulty: Difficulty, pilot: Pilot) => void;
  difficulty: Difficulty;
  onDifficultyChange: (diff: Difficulty) => void;
  selectedPilot: Pilot;
  onPilotChange: (pilot: Pilot) => void;
  highScoreRecord: HighScoreRecord;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  difficulty,
  onDifficultyChange,
  selectedPilot,
  onPilotChange,
  highScoreRecord,
  isMuted,
  onToggleMute,
}) => {
  const difficulties: {
    id: Difficulty;
    label: string;
    desc: string;
    aiSpeed: string;
    multiplier: string;
    color: string;
  }[] = [
    {
      id: 'easy',
      label: 'Easy Protocol',
      desc: 'Moderate traffic with forgiving AI reaction delay. Ideal for rookie pilots.',
      aiSpeed: 'Moderate (75-85%)',
      multiplier: '1.0x',
      color: 'border-emerald-500/50 hover:border-emerald-400 text-emerald-400',
    },
    {
      id: 'medium',
      label: 'Medium Grid',
      desc: 'Balanced competition. AI actively evades hazards and challenges your lane.',
      aiSpeed: 'Standard (90-105%)',
      multiplier: '1.4x',
      color: 'border-cyan-500/50 hover:border-cyan-400 text-cyan-400',
    },
    {
      id: 'hard',
      label: 'Hard Overdrive',
      desc: 'Hyper-reactive AI opponents draft, block lanes, and aggressively contest position.',
      aiSpeed: 'Overdrive (110-125%)',
      multiplier: '2.0x',
      color: 'border-rose-500/50 hover:border-rose-400 text-rose-400',
    },
  ];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-5 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col gap-5 text-slate-100 my-auto">
        {/* Header Branding */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-1">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Game AI & Cyber Heroine Racing</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-['Chakra_Petch'] flex items-center gap-2">
              <span>NEON CYBER RACING</span>
              <span className="text-sm font-mono px-2 py-0.5 rounded bg-pink-500/20 border border-pink-500/40 text-pink-300">
                AI PILOTS
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-['Outfit']">
              Select your cyber heroine pilot, activate tactical AI co-pilot comms, dodge hazards, and conquer the glowing cyber highway.
            </p>
          </div>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>
        </div>

        {/* High Score / Record Strip */}
        {highScoreRecord.score > 0 && (
          <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-purple-300">
              <Trophy className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-semibold uppercase tracking-wider">Pilot Record</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <span>
                Score: <strong className="text-white tabular-nums">{highScoreRecord.score.toLocaleString()}</strong>
              </span>
              <span>
                Distance: <strong className="text-white tabular-nums">{highScoreRecord.distance.toLocaleString()}m</strong>
              </span>
              <span>
                Coins: <strong className="text-amber-400 tabular-nums">{highScoreRecord.coins}</strong>
              </span>
              <span>
                Gems: <strong className="text-pink-400 tabular-nums">{highScoreRecord.gems || 0}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Pilot Selection Section */}
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Select Cyber Heroine Pilot</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PILOTS.map((pilot) => {
              const isSelected = selectedPilot.id === pilot.id;
              return (
                <button
                  key={pilot.id}
                  onClick={() => onPilotChange(pilot)}
                  type="button"
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-slate-800/90 shadow-[0_0_20px_rgba(255,42,133,0.3)] ring-2'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
                  }`}
                  style={{
                    borderColor: isSelected ? pilot.glowColor : undefined,
                    boxShadow: isSelected ? `0 0 15px ${pilot.glowColor}55` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{pilot.badgeEmoji}</span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase"
                      style={{
                        backgroundColor: `${pilot.carColor}33`,
                        color: pilot.glowColor,
                        border: `1px solid ${pilot.glowColor}66`,
                      }}
                    >
                      {pilot.callsign}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold font-mono text-white leading-tight">
                      {pilot.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                      {pilot.title}
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-pink-300 pt-1 border-t border-slate-800">
                    {pilot.perk}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Pilot Highlight Box */}
          <div
            className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono"
            style={{ borderColor: `${selectedPilot.glowColor}55` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedPilot.badgeEmoji}</span>
              <div>
                <span className="text-white font-bold">{selectedPilot.carName}</span>
                <span className="text-slate-400 text-[11px] block italic font-['Outfit']">
                  "{selectedPilot.quote}"
                </span>
              </div>
            </div>
            <div
              className="px-2.5 py-1 rounded text-[11px] font-bold uppercase shrink-0"
              style={{
                backgroundColor: `${selectedPilot.carColor}33`,
                color: selectedPilot.glowColor,
              }}
            >
              PERK: {selectedPilot.perk}
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Protocol Difficulty</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {difficulties.map((d) => {
              const isSelected = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => onDifficultyChange(d.id)}
                  type="button"
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? `bg-slate-800/90 ${d.color} shadow-[0_0_15px_rgba(0,240,255,0.2)] ring-1 ring-cyan-400/50`
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-white">{d.label}</span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700">
                      {d.multiplier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{d.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collectibles & Girls Elements Overview */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-1.5 bg-slate-900/60 rounded">
            <span className="text-amber-400 font-bold block mb-0.5">¢ CYBER CREDITS</span>
            <span className="text-slate-400 text-[10px]">+100 Score Points</span>
          </div>
          <div className="p-1.5 bg-slate-900/60 rounded">
            <span className="text-pink-400 font-bold block mb-0.5">✨ STARLIGHT GEMS</span>
            <span className="text-slate-400 text-[10px]">+250 Score & Sparkles</span>
          </div>
          <div className="p-1.5 bg-slate-900/60 rounded">
            <span className="text-rose-400 font-bold block mb-0.5">💖 CRYSTAL HEARTS</span>
            <span className="text-slate-400 text-[10px]">+35% Nanite Shield HP</span>
          </div>
        </div>

        {/* Primary Launch Action */}
        <button
          onClick={() => onStart(difficulty, selectedPilot)}
          type="button"
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:via-purple-500 hover:to-cyan-400 text-white font-bold font-['Chakra_Petch'] text-lg tracking-wider flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-[0_0_30px_rgba(255,42,133,0.4)] cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>START RACE WITH {selectedPilot.name.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
};

