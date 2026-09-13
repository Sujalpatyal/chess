import React from 'react';
import { Trophy, RefreshCw, BarChart2, Home } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  title: string; // e.g. "Checkmate!", "Stalemate", "Time Out"
  subtitle: string; // e.g. "White wins by checkmate"
  whiteAccuracy?: number;
  blackAccuracy?: number;
  onNewGame: () => void;
  onReviewGame?: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  title,
  subtitle,
  whiteAccuracy,
  blackAccuracy,
  onNewGame,
  onReviewGame,
  onGoHome,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <Trophy className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-100 uppercase tracking-wide">{title}</h2>
          <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
        </div>

        {/* Accuracies if available */}
        {(whiteAccuracy !== undefined || blackAccuracy !== undefined) && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 block">White Accuracy</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {whiteAccuracy ?? 85}%
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Black Accuracy</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {blackAccuracy ?? 82}%
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {onReviewGame && (
            <button
              onClick={onReviewGame}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Review Game Analysis</span>
            </button>
          )}

          <button
            onClick={onNewGame}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Play New Game</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full py-2 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
