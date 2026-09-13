import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard, BoardArrow } from '../../components/ChessBoard/ChessBoard';
import { storageService } from '../../services/StorageService';
import { soundManager } from '../../chess/sounds';
import { MoveClassification, PieceColor, SavedGame, MoveAnalysis } from '../../types/chess';
import { AlertTriangle, CheckCircle2, XCircle, RotateCcw, ArrowRight, Lightbulb } from 'lucide-react';

interface MistakePuzzle {
  gameId: string;
  ply: number;
  fenBefore: string;
  playedMove: string;
  bestMoveUci: string;
  bestMoveSan: string;
  explanation?: string;
}

export const LearnFromMistakesPage: React.FC = () => {
  const [mistakes, setMistakes] = useState<MistakePuzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active puzzle state
  const currentMistake = mistakes[currentIndex];
  const [chess, setChess] = useState<Chess | null>(null);
  const [, setRenderTrigger] = useState(0);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [revealed, setRevealed] = useState(false);

  const settings = storageService.getSettings();

  useEffect(() => {
    // Scan saved games for mistakes made by the user
    const games = storageService.getSavedGames();
    const collected: MistakePuzzle[] = [];

    for (const g of games) {
      if (!g.analyses || g.analyses.length === 0) continue;
      const userColor = g.playerColor || 'w';

      const tempChess = new Chess();
      for (let i = 0; i < g.analyses.length; i++) {
        const fenBefore = tempChess.fen();
        const a = g.analyses[i];
        tempChess.move(a.san);

        if (
          a.color === userColor &&
          (a.classification === MoveClassification.BLUNDER ||
            a.classification === MoveClassification.MISTAKE) &&
          a.bestMove &&
          a.bestMove !== '0000'
        ) {
          collected.push({
            gameId: g.id,
            ply: i + 1,
            fenBefore,
            playedMove: a.san,
            bestMoveUci: a.bestMove,
            bestMoveSan: a.bestMoveSan || a.bestMove,
            explanation: a.explanation,
          });
        }
      }
    }

    // Fallback sample mistakes if player hasn't analyzed personal games yet
    if (collected.length === 0) {
      collected.push({
        gameId: 'sample_1',
        ply: 12,
        fenBefore: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5',
        playedMove: 'Re1',
        bestMoveUci: 'd2d4',
        bestMoveSan: 'd4',
        explanation: 'Strike in the center with d4! exploiting the pinned knight.',
      });
      collected.push({
        gameId: 'sample_2',
        ply: 18,
        fenBefore: 'r2qk2r/ppp2ppp/2np4/2b1p3/2B1P1b1/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 1 7',
        playedMove: 'c2c3',
        bestMoveUci: 'c4f7',
        bestMoveSan: 'Bxf7+',
        explanation: 'Tactical sacrifice Bxf7+! followed by Ng5+ recovers the piece with an attack.',
      });
    }

    setMistakes(collected);
    if (collected[0]) {
      setChess(new Chess(collected[0].fenBefore));
    }
  }, []);

  useEffect(() => {
    if (currentMistake) {
      setChess(new Chess(currentMistake.fenBefore));
      setStatus('playing');
      setRevealed(false);
      setRenderTrigger((r) => r + 1);
    }
  }, [currentIndex, currentMistake]);

  const orientation =
    currentMistake?.fenBefore.split(' ')[1] === 'w' ? 'w' : ('b' as PieceColor);

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (!chess || status === 'correct') return;

    const playedUci = `${move.from}${move.to}${move.promotion || ''}`;
    const bestUci = currentMistake.bestMoveUci.toLowerCase();

    try {
      const res = chess.move(move);
      if (!res) return;
      setRenderTrigger((r) => r + 1);

      if (playedUci === bestUci || res.san === currentMistake.bestMoveSan) {
        setStatus('correct');
        soundManager.playCorrect();
      } else {
        setStatus('wrong');
        soundManager.playError();
      }
    } catch {
      soundManager.playError();
    }
  };

  const handleReset = () => {
    if (currentMistake) {
      setChess(new Chess(currentMistake.fenBefore));
      setStatus('playing');
      setRevealed(false);
      setRenderTrigger((r) => r + 1);
    }
  };

  const arrows: BoardArrow[] = [];
  if (revealed && currentMistake && currentMistake.bestMoveUci.length >= 4) {
    arrows.push({
      from: currentMistake.bestMoveUci.slice(0, 2),
      to: currentMistake.bestMoveUci.slice(2, 4),
      color: '#10B981',
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Learn From Mistakes</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Replay your own blunders and find the moves you should have played.
          </p>
        </div>

        <span className="text-xs font-mono text-zinc-400">
          Mistake #{currentIndex + 1} of {mistakes.length}
        </span>
      </div>

      {chess && currentMistake && (
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
          <div className="flex flex-col items-center gap-3 w-full max-w-[500px]">
            <ChessBoard
              chess={chess}
              orientation={orientation}
              theme={settings.boardTheme}
              pieceStyle={settings.pieceStyle}
              arrows={arrows}
              onMove={handleMove}
              disabled={status === 'correct'}
            />

            <div className="w-full flex items-center justify-between gap-2">
              <button
                onClick={() => setRevealed(true)}
                className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-amber-400 flex items-center gap-1.5 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Show Solution</span>
              </button>

              <button
                onClick={handleReset}
                className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>

              <button
                onClick={() => setCurrentIndex((idx) => (idx + 1) % mistakes.length)}
                className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Next Mistake</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs space-y-1 text-rose-300">
                <span className="font-bold block">In the game, you played:</span>
                <span className="text-sm font-mono font-bold text-rose-200">
                  {currentMistake.playedMove}
                </span>
                <p className="text-[11px] text-rose-400/80">
                  This was classified as a tactical blunder or mistake.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-100">
                  Find the Better Move
                </h3>
                <p className="text-xs text-zinc-400">
                  Can you spot the optimal move Stockfish recommended instead?
                </p>
              </div>

              {status === 'correct' && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-2.5 text-emerald-300 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Spot on!</span>
                    <span className="text-[11px] text-emerald-400/80">
                      You found the engine’s best move: {currentMistake.bestMoveSan}.
                    </span>
                  </div>
                </div>
              )}

              {status === 'wrong' && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-2.5 text-rose-300 text-xs animate-in fade-in">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Not the best continuation.</span>
                    <span className="text-[11px] text-rose-400/80">Try again or reveal the answer.</span>
                  </div>
                </div>
              )}

              {revealed && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5 animate-in fade-in">
                  <span className="text-amber-400 font-bold block">
                    Best Move: {currentMistake.bestMoveSan}
                  </span>
                  {currentMistake.explanation && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {currentMistake.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
