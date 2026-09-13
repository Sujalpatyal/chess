import React, { useEffect, useRef } from 'react';
import { MoveAnalysis, MoveClassificationType } from '../../types/chess';
import { getClassificationColor } from '../../analysis/moveClassification';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Play, Pause } from 'lucide-react';

interface MoveHistoryProps {
  moves: string[]; // SAN array
  analyses?: MoveAnalysis[];
  currentMoveIndex: number; // -1 for startpos, 0 for 1st move, etc.
  onSelectMove: (index: number) => void;
  onFirst?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onLast?: () => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  analyses = [],
  currentMoveIndex,
  onSelectMove,
  onFirst,
  onPrev,
  onNext,
  onLast,
  isPlaying = false,
  onTogglePlay,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Auto scroll into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentMoveIndex]);

  // Group moves into pairs (White move, Black move)
  const pairs: { moveNum: number; whiteIndex: number; blackIndex?: number }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      moveNum: Math.floor(i / 2) + 1,
      whiteIndex: i,
      blackIndex: i + 1 < moves.length ? i + 1 : undefined,
    });
  }

  const getBadgeIcon = (classification?: MoveClassificationType) => {
    switch (classification) {
      case 'brilliant': return '!!';
      case 'excellent': return '★';
      case 'good': return '✓';
      case 'inaccuracy': return '?!';
      case 'mistake': return '?';
      case 'blunder': return '??';
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Move History</h3>
        <span className="text-xs font-mono text-zinc-500">{moves.length} ply</span>
      </div>

      {/* Move list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[300px] sm:max-h-[360px]">
        {pairs.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">Game started. Play a move!</div>
        ) : (
          pairs.map((p) => {
            const whiteSan = moves[p.whiteIndex];
            const blackSan = p.blackIndex !== undefined ? moves[p.blackIndex] : null;
            const whiteAnalysis = analyses[p.whiteIndex];
            const blackAnalysis = p.blackIndex !== undefined ? analyses[p.blackIndex] : undefined;

            const isWhiteActive = currentMoveIndex === p.whiteIndex;
            const isBlackActive = p.blackIndex !== undefined && currentMoveIndex === p.blackIndex;

            return (
              <div
                key={p.moveNum}
                className="grid grid-cols-[38px_1fr_1fr] items-center text-xs rounded-md px-2 py-1 hover:bg-zinc-800/40"
              >
                <span className="text-zinc-500 font-mono select-none">{p.moveNum}.</span>

                {/* White Move */}
                <button
                  ref={isWhiteActive ? activeItemRef : null}
                  onClick={() => onSelectMove(p.whiteIndex)}
                  className={`flex items-center justify-between px-2 py-1 rounded text-left font-medium transition-all ${
                    isWhiteActive
                      ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs'
                      : 'text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <span>{whiteSan}</span>
                  {whiteAnalysis?.classification && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded border font-mono font-bold ml-1 ${getClassificationColor(
                        whiteAnalysis.classification
                      )}`}
                    >
                      {getBadgeIcon(whiteAnalysis.classification)}
                    </span>
                  )}
                </button>

                {/* Black Move */}
                {blackSan && p.blackIndex !== undefined ? (
                  <button
                    ref={isBlackActive ? activeItemRef : null}
                    onClick={() => onSelectMove(p.blackIndex!)}
                    className={`flex items-center justify-between px-2 py-1 rounded text-left font-medium transition-all ml-1 ${
                      isBlackActive
                        ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-xs'
                        : 'text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{blackSan}</span>
                    {blackAnalysis?.classification && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded border font-mono font-bold ml-1 ${getClassificationColor(
                          blackAnalysis.classification
                        )}`}
                      >
                        {getBadgeIcon(blackAnalysis.classification)}
                      </span>
                    )}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="p-2 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between gap-1">
        <button
          onClick={onFirst}
          disabled={currentMoveIndex <= -1}
          className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
          title="Start Position"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onPrev}
          disabled={currentMoveIndex <= -1}
          className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
          title="Previous Move"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {onTogglePlay && (
          <button
            onClick={onTogglePlay}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition-colors"
            title={isPlaying ? 'Pause' : 'Auto Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={onNext}
          disabled={currentMoveIndex >= moves.length - 1}
          className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
          title="Next Move"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onLast}
          disabled={currentMoveIndex >= moves.length - 1}
          className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
          title="Current Move"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
