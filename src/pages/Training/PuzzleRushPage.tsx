import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '../../components/ChessBoard/ChessBoard';
import { PUZZLE_DATABASE, Puzzle } from '../../data/puzzles';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { PieceColor } from '../../types/chess';
import { Flame, Heart, Play, RotateCcw, Trophy, Clock } from 'lucide-react';

export const PuzzleRushPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(storageService.getStatistics().puzzleRushHighScore);

  // Sort puzzles ascending by rating for progression
  const sortedPuzzles = [...PUZZLE_DATABASE].sort((a, b) => a.rating - b.rating);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPuzzle: Puzzle = sortedPuzzles[currentIndex] || sortedPuzzles[0];
  const [chess, setChess] = useState(() => new Chess(currentPuzzle.fen));
  const [, setRenderTrigger] = useState(0);
  const [currentMoveStep, setCurrentMoveStep] = useState(0);

  const settings = storageService.getSettings();
  const orientation = (currentPuzzle.fen.split(' ')[1] === 'w' ? 'w' : 'b') as PieceColor;

  // Countdown timer
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver]);

  const startRush = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setTimeLeft(180);
    setLives(3);
    setScore(0);
    setCurrentIndex(0);
    loadPuzzle(sortedPuzzles[0]);
    soundManager.playGameStart();
  };

  const loadPuzzle = (puz: Puzzle) => {
    setChess(new Chess(puz.fen));
    setCurrentMoveStep(0);
    setRenderTrigger((r) => r + 1);
  };

  const endGame = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    soundManager.playGameOver();

    // Check high score
    if (score > highScore) {
      setHighScore(score);
      storageService.saveStatistics({ puzzleRushHighScore: score });
    }
  };

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (!isPlaying || isGameOver) return;

    const expectedUci = currentPuzzle.moves[currentMoveStep];
    const playedUci = `${move.from}${move.to}${move.promotion || ''}`;

    try {
      const res = chess.move(move);
      if (!res) return;
      setRenderTrigger((r) => r + 1);

      if (playedUci === expectedUci) {
        soundManager.playMove();
        const nextStep = currentMoveStep + 1;

        if (nextStep >= currentPuzzle.moves.length) {
          // Solved!
          soundManager.playCorrect();
          setScore((s) => s + 1);
          advanceNextPuzzle();
        } else {
          // Opponent move
          setCurrentMoveStep(nextStep);
          setTimeout(() => {
            const oppUci = currentPuzzle.moves[nextStep];
            chess.move({
              from: oppUci.slice(0, 2),
              to: oppUci.slice(2, 4),
              promotion: oppUci[4] || undefined,
            });
            setCurrentMoveStep(nextStep + 1);
            setRenderTrigger((r) => r + 1);
            soundManager.playMove();

            if (nextStep + 1 >= currentPuzzle.moves.length) {
              soundManager.playCorrect();
              setScore((s) => s + 1);
              advanceNextPuzzle();
            }
          }, 250);
        }
      } else {
        // Strike!
        soundManager.playError();
        const nextLives = lives - 1;
        setLives(nextLives);
        if (nextLives <= 0) {
          endGame();
        } else {
          // Skip to next puzzle after a strike
          advanceNextPuzzle();
        }
      }
    } catch {
      soundManager.playError();
    }
  };

  const advanceNextPuzzle = () => {
    const nextIdx = (currentIndex + 1) % sortedPuzzles.length;
    setCurrentIndex(nextIdx);
    loadPuzzle(sortedPuzzles[nextIdx]);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <span>Puzzle Rush (3 Minutes)</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Solve as many puzzles as you can before time expires or you lose 3 lives.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span>High Score: {highScore}</span>
          </div>
        </div>
      </div>

      {!isPlaying && !isGameOver ? (
        <div className="max-w-md mx-auto py-12 text-center space-y-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto flex items-center justify-center">
            <Flame className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-zinc-100 uppercase tracking-wide">
              Ready for Puzzle Rush?
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              You have 3 minutes and 3 lives. Each correct answer increases your score and advances difficulty.
            </p>
          </div>

          <button
            onClick={startRush}
            className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-zinc-950 font-extrabold text-sm uppercase tracking-wider transition-colors shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-zinc-950" />
            <span>Start Rush</span>
          </button>
        </div>
      ) : isGameOver ? (
        <div className="max-w-md mx-auto py-12 text-center space-y-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-zinc-100 uppercase tracking-wide">Rush Completed!</h2>
            <p className="text-xs text-zinc-400">Final score achieved</p>
          </div>

          <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800">
            <span className="text-4xl font-black font-mono text-amber-400">{score}</span>
            <span className="text-xs text-zinc-500 block mt-1">Puzzles Solved</span>
          </div>

          <button
            onClick={startRush}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status HUD */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-rose-400 font-mono font-bold text-lg">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <div className="flex items-center justify-center gap-1">
              {[0, 1, 2].map((idx) => (
                <Heart
                  key={idx}
                  className={`w-5 h-5 ${
                    idx < lives ? 'text-rose-500 fill-rose-500' : 'text-zinc-700'
                  }`}
                />
              ))}
            </div>

            <div className="text-lg font-black font-mono text-amber-400">
              Score: {score}
            </div>
          </div>

          {/* Active Board */}
          <div className="flex justify-center">
            <div className="w-full max-w-[500px]">
              <ChessBoard
                chess={chess}
                orientation={orientation}
                theme={settings.boardTheme}
                pieceStyle={settings.pieceStyle}
                onMove={handleMove}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
