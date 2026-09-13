import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard, BoardArrow } from '../../components/ChessBoard/ChessBoard';
import { PUZZLE_DATABASE, Puzzle } from '../../data/puzzles';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { PieceColor } from '../../types/chess';
import {
  Zap,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const PuzzlesPage: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [filteredPuzzles, setFilteredPuzzles] = useState<Puzzle[]>(PUZZLE_DATABASE);
  const [puzzleIndex, setPuzzleIndex] = useState(0);

  const currentPuzzle: Puzzle = filteredPuzzles[puzzleIndex] || PUZZLE_DATABASE[0];
  const [chess, setChess] = useState(() => new Chess(currentPuzzle.fen));
  const [, setRenderTrigger] = useState(0);

  const [currentMoveStep, setCurrentMoveStep] = useState(0); // Which move in solution
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState('');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const settings = storageService.getSettings();
  const orientation = (currentPuzzle.fen.split(' ')[1] === 'w' ? 'w' : 'b') as PieceColor;

  useEffect(() => {
    if (selectedTheme === 'all') {
      setFilteredPuzzles(PUZZLE_DATABASE);
    } else {
      setFilteredPuzzles(
        PUZZLE_DATABASE.filter((p) => p.themes.includes(selectedTheme))
      );
    }
    setPuzzleIndex(0);
  }, [selectedTheme]);

  useEffect(() => {
    loadPuzzle(currentPuzzle);
  }, [currentPuzzle]);

  const loadPuzzle = (puz: Puzzle) => {
    const c = new Chess(puz.fen);
    setChess(c);
    setCurrentMoveStep(0);
    setStatus('playing');
    setHintLevel(0);
    setHintText('');
    setLastMove(null);
    setRenderTrigger((r) => r + 1);
  };

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (status === 'correct') return;

    const expectedMoveUci = currentPuzzle.moves[currentMoveStep];
    const playedUci = `${move.from}${move.to}${move.promotion || ''}`;

    try {
      const res = chess.move(move);
      if (!res) return;

      setLastMove({ from: move.from, to: move.to });
      setRenderTrigger((r) => r + 1);

      if (playedUci === expectedMoveUci) {
        // Move is correct!
        soundManager.playMove();
        const nextStep = currentMoveStep + 1;

        if (nextStep >= currentPuzzle.moves.length) {
          // Puzzle completed!
          setStatus('correct');
          soundManager.playCorrect();
          storageService.recordPuzzleResult(true);
        } else {
          // Opponent automatic response
          setCurrentMoveStep(nextStep);
          setTimeout(() => {
            const oppMoveUci = currentPuzzle.moves[nextStep];
            const oppFrom = oppMoveUci.slice(0, 2);
            const oppTo = oppMoveUci.slice(2, 4);
            const oppProm = oppMoveUci[4] || undefined;
            chess.move({ from: oppFrom, to: oppTo, promotion: oppProm });
            setLastMove({ from: oppFrom, to: oppTo });
            setCurrentMoveStep(nextStep + 1);
            setRenderTrigger((r) => r + 1);
            soundManager.playMove();

            if (nextStep + 1 >= currentPuzzle.moves.length) {
              setStatus('correct');
              soundManager.playCorrect();
              storageService.recordPuzzleResult(true);
            }
          }, 400);
        }
      } else {
        // Wrong move!
        setStatus('wrong');
        soundManager.playError();
        storageService.recordPuzzleResult(false);
      }
    } catch {
      soundManager.playError();
    }
  };

  const handleRetry = () => {
    loadPuzzle(currentPuzzle);
  };

  const handleNextPuzzle = () => {
    if (puzzleIndex + 1 < filteredPuzzles.length) {
      setPuzzleIndex(puzzleIndex + 1);
    } else {
      setPuzzleIndex(0);
    }
  };

  const handleHint = () => {
    const expected = currentPuzzle.moves[currentMoveStep];
    if (!expected) return;

    if (hintLevel === 0) {
      setHintLevel(1);
      setHintText(`Hint: Look at the piece on ${expected.slice(0, 2).toUpperCase()}`);
    } else {
      setHintLevel(2);
      setHintText(`Target move: ${expected.toUpperCase()}`);
    }
  };

  const arrows: BoardArrow[] = [];
  if (hintLevel >= 2) {
    const expected = currentPuzzle.moves[currentMoveStep];
    if (expected && expected.length >= 4) {
      arrows.push({
        from: expected.slice(0, 2),
        to: expected.slice(2, 4),
        color: '#F59E0B',
      });
    }
  }

  const themesList = [
    { id: 'all', label: 'All Themes' },
    { id: 'fork', label: 'Forks' },
    { id: 'pin', label: 'Pins' },
    { id: 'skewer', label: 'Skewers' },
    { id: 'back-rank', label: 'Back Rank' },
    { id: 'deflection', label: 'Deflection' },
    { id: 'discovered-attack', label: 'Discovered Attack' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>Tactical Puzzles</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Find the winning tactical sequence. Rating: {currentPuzzle.rating} • {currentPuzzle.description}
          </p>
        </div>

        {/* Theme Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          {themesList.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t.id)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedTheme === t.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Board & Puzzle Details */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="flex flex-col items-center gap-3 w-full max-w-[500px]">
          <ChessBoard
            chess={chess}
            orientation={orientation}
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            arrows={arrows}
            onMove={handleMove}
            lastMove={lastMove}
            disabled={status === 'correct'}
          />

          <div className="w-full flex items-center justify-between gap-2">
            <button
              onClick={handleHint}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-amber-400 flex items-center gap-1.5 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Hint</span>
            </button>

            <button
              onClick={handleRetry}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>

            <button
              onClick={handleNextPuzzle}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Next Puzzle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Puzzle Card Side Panel */}
        <div className="w-full lg:w-96 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Puzzle #{puzzleIndex + 1} of {filteredPuzzles.length}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                Rating {currentPuzzle.rating}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-100">
                {orientation === 'w' ? 'White' : 'Black'} to move
              </h3>
              <p className="text-xs text-zinc-400">{currentPuzzle.description}</p>
            </div>

            {/* Status Feedback */}
            {status === 'correct' && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-2.5 text-emerald-300 text-xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block">Puzzle Solved!</span>
                  <span className="text-[11px] text-emerald-400/80">Excellent calculation. Ready for the next one?</span>
                </div>
              </div>
            )}

            {status === 'wrong' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-2.5 text-rose-300 text-xs animate-in fade-in">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold block">Not the best move.</span>
                  <span className="text-[11px] text-rose-400/80">Try again or use a hint to find the winning tactical line.</span>
                </div>
              </div>
            )}

            {hintText && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                {hintText}
              </div>
            )}

            {/* Themes Badges */}
            <div className="pt-2 border-t border-zinc-800/80">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">
                Tactical Themes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(currentPuzzle.themes || [currentPuzzle.theme]).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
