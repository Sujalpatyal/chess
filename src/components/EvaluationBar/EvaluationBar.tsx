import React from 'react';
import { EvaluationResult, PieceColor } from '../../types/chess';

interface EvaluationBarProps {
  evaluation: EvaluationResult;
  orientation?: PieceColor;
  heightClass?: string;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  orientation = 'w',
  heightClass = 'h-full min-h-[320px]',
}) => {
  const { score, isMate, mateIn, winProbabilityWhite, winProbabilityBlack } = evaluation;

  // Format display score
  let scoreText = '0.0';
  if (isMate) {
    scoreText = `M${Math.abs(mateIn || 1)}`;
  } else {
    const pawns = score / 100;
    scoreText = pawns > 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
  }

  // Calculate percentage of white fill on the bar (0 to 100%)
  // Capping between 5% and 95% so neither side completely disappears visually unless checkmate
  let whitePercent = 50;
  if (isMate) {
    whitePercent = (mateIn || 1) > 0 ? 100 : 0;
  } else {
    // Sigmoid mapping for smooth bar motion
    whitePercent = winProbabilityWhite;
  }

  const isFlipped = orientation === 'b';
  const topPercent = isFlipped ? 100 - whitePercent : 100 - whitePercent;

  return (
    <div className={`relative flex flex-col items-center w-8 sm:w-9 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 shadow-inner select-none ${heightClass}`}>
      {/* Black's portion (top) */}
      <div
        className="w-full bg-zinc-900 transition-all duration-300 ease-out flex flex-col justify-start items-center p-1"
        style={{ height: `${topPercent}%` }}
      >
        {!isFlipped && (score < 0 || (isMate && (mateIn || 0) < 0)) && (
          <span className="text-[10px] font-bold text-zinc-300 font-mono tracking-tight mt-0.5">
            {scoreText}
          </span>
        )}
      </div>

      {/* White's portion (bottom) */}
      <div
        className="w-full bg-zinc-100 transition-all duration-300 ease-out flex flex-col justify-end items-center p-1"
        style={{ height: `${100 - topPercent}%` }}
      >
        {!isFlipped && (score >= 0 && (!isMate || (mateIn || 0) > 0)) && (
          <span className="text-[10px] font-bold text-zinc-800 font-mono tracking-tight mb-0.5">
            {scoreText}
          </span>
        )}
      </div>

      {/* Probability indicator tooltips */}
      <div className="absolute inset-x-0 bottom-0 py-1 bg-zinc-900/80 backdrop-blur-xs text-center border-t border-zinc-800">
        <span className="text-[9px] font-semibold text-zinc-400 block leading-tight">
          {Math.round(isFlipped ? winProbabilityBlack : winProbabilityWhite)}%
        </span>
      </div>
    </div>
  );
};
