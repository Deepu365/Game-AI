import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { KeyControls } from '../game/types';

interface MobileControlsProps {
  controls: KeyControls;
  onControlChange: (key: keyof KeyControls, state: boolean) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  controls,
  onControlChange,
}) => {
  const bindTouch = (key: keyof KeyControls) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      onControlChange(key, true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      onControlChange(key, false);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      onControlChange(key, false);
    },
    onMouseDown: () => onControlChange(key, true),
    onMouseUp: () => onControlChange(key, false),
    onMouseLeave: () => onControlChange(key, false),
  });

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none p-3 pb-5 flex justify-between items-end select-none z-20">
      {/* Steering (Left / Right) */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          type="button"
          {...bindTouch('left')}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center transition-transform active:scale-90 shadow-xl touch-none ${
            controls.left
              ? 'bg-cyan-500/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.6)]'
              : 'bg-slate-900/80 border-slate-700/80 text-slate-200'
          }`}
          aria-label="Steer Left"
        >
          <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>

        <button
          type="button"
          {...bindTouch('right')}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center transition-transform active:scale-90 shadow-xl touch-none ${
            controls.right
              ? 'bg-cyan-500/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.6)]'
              : 'bg-slate-900/80 border-slate-700/80 text-slate-200'
          }`}
          aria-label="Steer Right"
        >
          <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Pedals & Boost (Accelerate, Brake, Nitro) */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* Brake */}
        <button
          type="button"
          {...bindTouch('brake')}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex flex-col items-center justify-center transition-transform active:scale-90 shadow-xl touch-none ${
            controls.brake
              ? 'bg-rose-500/40 border-rose-400 text-white shadow-[0_0_15px_rgba(255,0,85,0.6)]'
              : 'bg-slate-900/80 border-slate-700/80 text-rose-300'
          }`}
          aria-label="Brake"
        >
          <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] font-mono font-bold tracking-tighter">BRAKE</span>
        </button>

        {/* Nitro Boost */}
        <button
          type="button"
          {...bindTouch('boost')}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex flex-col items-center justify-center transition-transform active:scale-90 shadow-xl touch-none ${
            controls.boost
              ? 'bg-purple-500/50 border-purple-400 text-white shadow-[0_0_18px_rgba(168,85,247,0.7)]'
              : 'bg-slate-900/80 border-purple-500/40 text-purple-300'
          }`}
          aria-label="Nitro Boost"
        >
          <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-[9px] font-mono font-bold tracking-tighter">BOOST</span>
        </button>

        {/* Gas / Accelerate */}
        <button
          type="button"
          {...bindTouch('accelerate')}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex flex-col items-center justify-center transition-transform active:scale-90 shadow-xl touch-none ${
            controls.accelerate
              ? 'bg-cyan-500/40 border-cyan-400 text-white shadow-[0_0_18px_rgba(0,240,255,0.6)]'
              : 'bg-slate-900/80 border-cyan-500/50 text-cyan-300'
          }`}
          aria-label="Accelerate"
        >
          <ArrowUp className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-[10px] font-mono font-bold tracking-tighter">GAS</span>
        </button>
      </div>
    </div>
  );
};
