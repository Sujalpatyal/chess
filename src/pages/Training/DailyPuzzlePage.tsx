import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '../../components/ChessBoard/ChessBoard';
import { PUZZLE_DATABASE, Puzzle } from '../../data/puzzles';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { PieceColor } from '../../types/chess';
import { Calendar, CheckCircle2, XCircle, Flame, RotateCcw } from 'lucide-react';

export const DailyPuzzlePage: React.FC = () => {
  const stats = storageService.getStatistics();
  const todayStr = new Date().toISOString().split('T')[0];

  // Hash date to select deterministic puzzle
  const dateHash = todayStr.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
  const dailyPuzzleIndex = dateHash % PUZZLE_DATABASE.length;
  const puzzle: Puzzle = PUZZLE_DATABASE[dailyPuzzleIndex];

  const [chess, setChess] = useState(() => new Chess(puzzle.fen));
  const [, setRenderTrigger] = useState(0);
  const [currentMoveStep, setCurrentMoveStep] = useState(0);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [streak, setStreak] = useState(stats.dailyStreak);

  const settings = storageService.getSettings();
  const orientation = (puzzle.fen.split(' ')[1] === 'w' ? 'w' : 'b') as PieceColor;

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (status === 'correct') return;

    const expectedUci = puzzle.moves[currentMoveStep];
    const playedUci = `${move.from}${move.to}${move.promotion || ''}`;

    try {
      const res = chess.move(move);
      if (!res) return;
      setRenderTrigger((r) => r + 1);

      if (playedUci === expectedUci) {
        soundManager.playMove();
        const nextStep = currentMoveStep + 1;

        if (nextStep >= puzzle.moves.length) {
          handleSolved();
        } else {
          setCurrentMoveStep(nextStep);
          setTimeout(() => {
            const oppUci = puzzle.moves[nextStep];
            chess.move({
              from: oppUci.slice(0, 2),
              to: oppUci.slice(2, 4),
              promotion: oppUci[4] || undefined,
            });
            setCurrentMoveStep(nextStep + 1);
            setRenderTrigger((r) => r + 1);
            soundManager.playMove();

            if (nextStep + 1 >= puzzle.moves.length) {
              handleSolved();
            }
          }, 300);
        }
      } else {
        setStatus('wrong');
        soundManager.playError();
      }
    } catch {
      soundManager.playError();
    }
  };

  const handleSolved = () => {
    setStatus('correct');
    soundManager.playCorrect();
    storageService.recordPuzzleResult(true);

    if (stats.lastDailyPuzzleDate !== todayStr) {
      const newStreak = stats.dailyStreak + 1;
      setStreak(newStreak);
      storageService.saveStatistics({
        dailyStreak: newStreak,
        lastDailyPuzzleDate: todayStr,
      });
    }
  };

  const handleReset = () => {
    setChess(new Chess(puzzle.fen));
    setCurrentMoveStep(0);
    setStatus('playing');
    setRenderTrigger((r) => r + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Daily Chess Puzzle</span>
          </h1>
          <p className="text-xs text-zinc-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span>Daily Streak: {streak} Day{streak === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="flex flex-col items-center gap-3 w-full max-w-[500px]">
          <ChessBoard
            chess={chess}
            orientation={orientation}
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            onMove={handleMove}
            disabled={status === 'correct'}
          />

          <button
            onClick={handleReset}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Daily Position</span>
          </button>
        </div>

        <div className="w-full lg:w-96 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-zinc-100">
              {orientation === 'w' ? 'White' : 'Black'} to move & win
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{puzzle.description}</p>

            {status === 'correct' && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-2.5 text-emerald-300 text-xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block">Daily Puzzle Completed!</span>
                  <span className="text-[11px] text-emerald-400/80">Streak extended. Come back tomorrow for the next puzzle.</span>
                </div>
              </div>
            )}

            {status === 'wrong' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-2.5 text-rose-300 text-xs animate-in fade-in">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold block">Incorrect move.</span>
                  <span className="text-[11px] text-rose-400/80">Take another look at the board and retry.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
