import React from 'react';
import { PieceColor } from '../../types/chess';
import { Clock } from 'lucide-react';

interface GameClockProps {
  whiteTimeMs: number;
  blackTimeMs: number;
  activeColor: PieceColor | null;
  whiteName?: string;
  blackName?: string;
  isUnlimited?: boolean;
}

export const GameClock: React.FC<GameClockProps> = ({
  whiteTimeMs,
  blackTimeMs,
  activeColor,
  whiteName = 'White',
  blackName = 'Black',
  isUnlimited = false,
}) => {
  const formatTime = (ms: number) => {
    if (isUnlimited) return '∞';
    if (ms <= 0) return '0:00.0';
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (totalSeconds < 10) {
      const tenths = Math.floor((ms % 1000) / 100);
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWhiteLow = !isUnlimited && whiteTimeMs < 30000;
  const isBlackLow = !isUnlimited && blackTimeMs < 30000;

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-[560px] mx-auto select-none">
      {/* Black Player Card */}
      <div
        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-200 ${
          activeColor === 'b'
            ? 'bg-zinc-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-400/30'
            : 'bg-zinc-900/80 border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300 shrink-0">
            {blackName.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <span className="text-xs sm:text-sm font-semibold text-zinc-200 block truncate">
              {blackName}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Black</span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-sm sm:text-base tracking-wider ${
            isBlackLow
              ? 'bg-rose-950/60 text-rose-400 border border-rose-800 animate-pulse'
              : activeColor === 'b'
              ? 'bg-zinc-950 text-amber-300 border border-zinc-700'
              : 'bg-zinc-950/50 text-zinc-400 border border-zinc-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 opacity-60" />
          <span>{formatTime(blackTimeMs)}</span>
        </div>
      </div>

      {/* White Player Card */}
      <div
        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-200 ${
          activeColor === 'w'
            ? 'bg-zinc-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-400/30'
            : 'bg-zinc-900/80 border-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center font-bold text-xs text-zinc-800 shrink-0">
            {whiteName.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <span className="text-xs sm:text-sm font-semibold text-zinc-200 block truncate">
              {whiteName}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">White</span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-sm sm:text-base tracking-wider ${
            isWhiteLow
              ? 'bg-rose-950/60 text-rose-400 border border-rose-800 animate-pulse'
              : activeColor === 'w'
              ? 'bg-zinc-950 text-amber-300 border border-zinc-700'
              : 'bg-zinc-950/50 text-zinc-400 border border-zinc-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 opacity-60" />
          <span>{formatTime(whiteTimeMs)}</span>
        </div>
      </div>
    </div>
  );
};
