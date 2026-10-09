import React from 'react';
import { GameStats, Difficulty, Pilot, CoPilotMessage } from '../game/types';
import { AIScannerInfo } from '../game/engine';
import { Volume2, VolumeX, Pause, Shield, Zap, Coins, Gauge, Trophy, Sparkles, Radio, Cpu, AlertTriangle } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  health: number;
  nitro: number;
  speed: number;
  difficulty: Difficulty;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  highScore: number;
  pilot: Pilot;
  coPilotMessage: CoPilotMessage | null;
  scanner: AIScannerInfo;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  health,
  nitro,
  speed,
  difficulty,
  isMuted,
  onToggleMute,
  onPause,
  highScore,
  pilot,
  coPilotMessage,
  scanner,
}) => {
  const healthColor =
    health > 50 ? 'bg-emerald-400 text-emerald-400' :
    health > 25 ? 'bg-amber-400 text-amber-400' :
    'bg-rose-500 text-rose-500 animate-pulse';

  const speedRatio = Math.min(speed / 340, 1.0);

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between select-none h-full">
      {/* Top Header Strip */}
      <div className="flex items-start justify-between gap-3 w-full max-w-6xl mx-auto">
        {/* Left: Score & Pilot Status */}
        <div className="flex flex-col gap-1.5">
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-3.5 py-2 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-center gap-3">
            {/* Pilot Avatar Badge */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border shadow-inner"
              style={{
                backgroundColor: `${pilot.carColor}22`,
                borderColor: pilot.glowColor,
                boxShadow: `0 0 10px ${pilot.glowColor}44`,
              }}
              title={`${pilot.name} - ${pilot.title}`}
            >
              {pilot.badgeEmoji}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-mono text-white tracking-wider uppercase">
                  {pilot.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  [{pilot.callsign}]
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {Math.floor(stats.score).toLocaleString()}
              </div>
            </div>

            <div className="h-7 w-px bg-slate-800 hidden sm:block" />

            <div className="hidden sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Distance
              </div>
              <div className="text-base font-bold font-mono text-slate-200 tabular-nums">
                {stats.distance >= 1000
                  ? `${(stats.distance / 1000).toFixed(2)} km`
                  : `${Math.floor(stats.distance)} m`}
              </div>
            </div>
          </div>

          {/* Sub metrics: Coins, Starlight Gems & Pilot Record */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Coins */}
            <div className="bg-slate-900/85 backdrop-blur-sm border border-amber-500/30 rounded-lg px-2.5 py-1 text-amber-300 flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Coins className="w-3.5 h-3.5" />
              <span className="font-bold tabular-nums">{stats.coins}</span>
            </div>

            {/* Starlight Gems */}
            <div className="bg-slate-900/85 backdrop-blur-sm border border-pink-500/40 rounded-lg px-2.5 py-1 text-pink-300 flex items-center gap-1.5 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span className="font-bold tabular-nums">{stats.gems}</span>
            </div>

            {highScore > 0 && (
              <div className="bg-slate-900/85 backdrop-blur-sm border border-purple-500/30 rounded-lg px-2.5 py-1 text-purple-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span className="text-[10px] text-slate-400">BEST:</span>
                <span className="font-bold tabular-nums">{highScore.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Game AI Tactical Radar Scanner (Real-time neural analysis) */}
        <div className="hidden lg:flex flex-col items-center">
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-xl px-4 py-2 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-cyan-400 font-semibold">
              <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>GAME AI RADAR // SCANNER</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  scanner.systemStatus === 'HAZARD_CRITICAL'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                    : scanner.systemStatus === 'EVASIVE_ALERT'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {scanner.systemStatus}
              </span>
            </div>

            {/* Lane mini radar */}
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-400 text-[10px]">LANES:</span>
              <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {[0, 1, 2, 3].map((laneIdx) => {
                  const isRec = scanner.recommendedLane === laneIdx;
                  return (
                    <div
                      key={laneIdx}
                      className={`w-5 h-4 rounded text-[9px] flex items-center justify-center font-bold ${
                        isRec
                          ? 'bg-cyan-500 text-slate-950 ring-1 ring-cyan-300'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      L{laneIdx + 1}
                    </div>
                  );
                })}
              </div>

              {scanner.threatInLane && (
                <div className="flex items-center gap-1 text-rose-400 font-semibold text-[10px]">
                  <AlertTriangle className="w-3 h-3" />
                  <span>EVADE TO L{scanner.recommendedLane + 1}!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-lg active:scale-95 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="h-10 px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 hover:text-white flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(0,240,255,0.2)] active:scale-95 cursor-pointer text-xs font-mono font-bold"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">PAUSE [P]</span>
          </button>
        </div>
      </div>

      {/* Middle Floating: Live Holographic AI Co-Pilot Voice Comms */}
      {coPilotMessage && (
        <div className="w-full max-w-md mx-auto my-auto animate-fade-in pointer-events-none">
          <div
            className="bg-slate-900/95 backdrop-blur-lg border rounded-2xl p-3.5 shadow-2xl flex items-center gap-3.5"
            style={{
              borderColor:
                coPilotMessage.type === 'warning'
                  ? '#f43f5e'
                  : coPilotMessage.type === 'boost'
                  ? '#a855f7'
                  : pilot.glowColor,
              boxShadow: `0 0 25px ${
                coPilotMessage.type === 'warning'
                  ? 'rgba(244,63,94,0.4)'
                  : `${pilot.glowColor}44`
              }`,
            }}
          >
            {/* Hologram Avatar Orb */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border animate-pulse"
              style={{
                backgroundColor: `${pilot.carColor}33`,
                borderColor: pilot.glowColor,
              }}
            >
              {pilot.badgeEmoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>{coPilotMessage.sender}</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white tracking-wide mt-0.5 leading-snug font-['Outfit']">
                "{coPilotMessage.text}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Gauges: Health, Nitro & Speedometer */}
      <div className="w-full max-w-6xl mx-auto mt-auto pt-6 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
        {/* Left Bottom: Shield Health & Nitro Fuel */}
        <div className="w-full sm:w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl space-y-2">
          {/* Shield HP */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                SHIELD INTEGRITY
              </span>
              <span className={`font-bold tabular-nums ${healthColor.split(' ')[1]}`}>
                {Math.round(health)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-200 ${healthColor.split(' ')[0]}`}
                style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
              />
            </div>
          </div>

          {/* Nitro Boost */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                NITRO SYSTEM
              </span>
              <span className="text-purple-300 font-bold tabular-nums">
                {Math.round(nitro)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-full transition-all duration-100 shadow-[0_0_10px_rgba(168,85,247,0.7)]"
                style={{ width: `${Math.max(0, Math.min(100, nitro))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Bottom: Digital Speedometer */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 sm:px-4 sm:py-2.5 flex items-center gap-3 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
          <Gauge className="w-6 h-6 text-cyan-400 hidden sm:block shrink-0" />
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1 font-mono">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
                {speed}
              </span>
              <span className="text-xs font-bold text-cyan-400">KM/H</span>
            </div>
            {/* RPM / Speed Bar */}
            <div className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-75"
                style={{ width: `${speedRatio * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

