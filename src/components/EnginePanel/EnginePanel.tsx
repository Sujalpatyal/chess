import React from 'react';
import { EvaluationResult } from '../../types/chess';
import { Cpu, Lightbulb, Compass, Zap } from 'lucide-react';

interface EnginePanelProps {
  evaluation: EvaluationResult;
  isEngineActive: boolean;
  onToggleEngine: () => void;
  bestMoveSan?: string;
  depth: number;
  onSelectDepth?: (depth: number) => void;
  hintLevel?: number; // 0: none, 1: piece, 2: square, 3: full
  hintText?: string;
  onRequestHint?: () => void;
  isThinking?: boolean;
}

export const EnginePanel: React.FC<EnginePanelProps> = ({
  evaluation,
  isEngineActive,
  onToggleEngine,
  bestMoveSan,
  depth,
  onSelectDepth,
  hintLevel = 0,
  hintText,
  onRequestHint,
  isThinking = false,
}) => {
  const { score, isMate, mateIn, pv, winProbabilityWhite, winProbabilityBlack } = evaluation;

  const scoreDisplay = isMate
    ? `Mate in ${Math.abs(mateIn || 1)}`
    : score > 0
    ? `+${(score / 100).toFixed(2)}`
    : (score / 100).toFixed(2);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-200">Stockfish 16 Engine</span>
              {isThinking && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className="text-[10px] text-zinc-500">Neural UCI Web Worker</span>
          </div>
        </div>

        <button
          onClick={onToggleEngine}
          className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
            isEngineActive
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
          }`}
        >
          {isEngineActive ? 'Engine ON' : 'Engine OFF'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center select-none">
        <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Evaluation</span>
          <span
            className={`text-sm sm:text-base font-bold font-mono ${
              score > 50
                ? 'text-emerald-400'
                : score < -50
                ? 'text-rose-400'
                : 'text-zinc-200'
            }`}
          >
            {scoreDisplay}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Depth</span>
          <span className="text-sm sm:text-base font-bold font-mono text-zinc-200">
            {evaluation.depth} / {depth}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Win % (W/B)</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-zinc-300">
            {Math.round(winProbabilityWhite)}% / {Math.round(winProbabilityBlack)}%
          </span>
        </div>
      </div>

      {/* Best Move & PV Line */}
      <div className="bg-zinc-950/80 rounded-lg p-2.5 border border-zinc-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Best Move:</span>
            <span className="font-mono font-bold text-amber-300">
              {bestMoveSan || evaluation.bestMove || 'Calculating...'}
            </span>
          </div>
          {onSelectDepth && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500">Depth:</span>
              {[8, 12, 16].map((d) => (
                <button
                  key={d}
                  onClick={() => onSelectDepth(d)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    depth === d
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {pv.length > 0 && (
          <div className="text-[11px] font-mono text-zinc-400 truncate flex items-center gap-1">
            <Compass className="w-3 h-3 text-zinc-500 shrink-0" />
            <span className="truncate">Line: {pv.slice(0, 5).join(' ')}</span>
          </div>
        )}
      </div>

      {/* Progressive Hint Button & Box */}
      {onRequestHint && (
        <div className="space-y-2">
          <button
            onClick={onRequestHint}
            className="w-full py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>
              {hintLevel === 0
                ? 'Get Hint (Level 1: Piece)'
                : hintLevel === 1
                ? 'Next Hint (Level 2: Square)'
                : hintLevel === 2
                ? 'Reveal Move (Level 3: Full Move)'
                : 'Reset Hint'}
            </span>
          </button>

          {hintText && (
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 animate-in fade-in">
              <div className="font-semibold text-amber-400 mb-0.5">
                Hint Level {hintLevel} of 3:
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">{hintText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
