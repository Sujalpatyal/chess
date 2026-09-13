import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '../../components/ChessBoard/ChessBoard';
import { MoveHistory } from '../../components/MoveHistory/MoveHistory';
import { stockfishEngine } from '../../engine/StockfishEngine';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { EyeOff, Eye, RotateCcw, Send, AlertCircle } from 'lucide-react';

export const BlindfoldPage: React.FC = () => {
  const [chess] = useState(() => new Chess());
  const [, setRenderTrigger] = useState(0);
  const [moves, setMoves] = useState<string[]>([]);
  const [moveInput, setMoveInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Blindfold settings
  const [hideMode, setHideMode] = useState<'pieces' | 'board'>('pieces');
  const [isPeeking, setIsPeeking] = useState(false);
  const [peekTimeLeft, setPeekTimeLeft] = useState(0);

  const settings = storageService.getSettings();

  useEffect(() => {
    stockfishEngine.initialize();
  }, []);

  // Peek countdown
  useEffect(() => {
    if (!isPeeking) return;
    const interval = setInterval(() => {
      setPeekTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPeeking(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPeeking]);

  const handlePeek = () => {
    setIsPeeking(true);
    setPeekTimeLeft(3);
  };

  const handleTextMove = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!moveInput.trim() || isAiThinking) return;

    try {
      const res = chess.move(moveInput.trim());
      if (res) {
        setMoves([...chess.history()]);
        setMoveInput('');
        soundManager.playMove();
        setRenderTrigger((r) => r + 1);

        // AI responds
        setIsAiThinking(true);
        setTimeout(() => {
          stockfishEngine.getBestMove(chess.fen(), 8, 600).then((best) => {
            setIsAiThinking(false);
            if (best && best !== '0000') {
              chess.move({
                from: best.slice(0, 2),
                to: best.slice(2, 4),
                promotion: best[4] || undefined,
              });
              setMoves([...chess.history()]);
              soundManager.playMove();
              setRenderTrigger((r) => r + 1);
            }
          });
        }, 400);
      }
    } catch {
      setError(`"${moveInput}" is not a valid or legal move. Use standard SAN (e.g. e4, Nf3, O-O).`);
      soundManager.playError();
    }
  };

  const handleReset = () => {
    chess.reset();
    setMoves([]);
    setMoveInput('');
    setError(null);
    setRenderTrigger((r) => r + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-purple-400" />
            <span>Blindfold Chess Trainer</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Train mental visualization by playing purely through algebraic notation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex items-center gap-1 text-xs">
            <button
              onClick={() => setHideMode('pieces')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                hideMode === 'pieces'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Hide Pieces
            </button>
            <button
              onClick={() => setHideMode('board')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                hideMode === 'board'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Hide Board
            </button>
          </div>

          <button
            onClick={handlePeek}
            disabled={isPeeking}
            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPeeking ? `Peeking (${peekTimeLeft}s)` : 'Peek (3s)'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="flex flex-col items-center gap-3 w-full max-w-[500px]">
          {/* Board or placeholder */}
          {hideMode === 'board' && !isPeeking ? (
            <div className="w-full aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
              <EyeOff className="w-12 h-12 text-purple-400/40" />
              <h3 className="text-sm font-bold text-zinc-300">Board Hidden (Full Blindfold)</h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                Visualize the board in your mind. Use the move input below to play your moves.
              </p>
            </div>
          ) : (
            <div className={!isPeeking && hideMode === 'pieces' ? '[&_svg]:hidden' : ''}>
              <ChessBoard
                chess={chess}
                orientation="w"
                theme={settings.boardTheme}
                pieceStyle={settings.pieceStyle}
                disabled={true}
              />
            </div>
          )}

          {/* Move Input Form */}
          <form onSubmit={handleTextMove} className="w-full space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={moveInput}
                onChange={(e) => {
                  setMoveInput(e.target.value);
                  setError(null);
                }}
                placeholder="Enter move in SAN... e.g. e4, Nf3, O-O"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!moveInput.trim() || isAiThinking}
                className="py-2 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Play Move</span>
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          <button
            onClick={handleReset}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Blindfold Match</span>
          </button>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-3">
          <MoveHistory
            moves={moves}
            currentMoveIndex={moves.length - 1}
            onSelectMove={() => {}}
            onFirst={() => {}}
            onPrev={() => {}}
            onNext={() => {}}
            onLast={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
