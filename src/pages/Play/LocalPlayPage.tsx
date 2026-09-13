import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '../../components/ChessBoard/ChessBoard';
import { MoveHistory } from '../../components/MoveHistory/MoveHistory';
import { GameClock } from '../../components/GameClock/GameClock';
import { GameOverModal } from '../../components/Modal/GameOverModal';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { identifyOpening } from '../../data/openings';
import { PieceColor, SavedGame } from '../../types/chess';
import { RotateCcw, Flag, Handshake, RefreshCw, FlipVertical } from 'lucide-react';

interface LocalPlayPageProps {
  onReviewGame?: (game: SavedGame) => void;
  onGoHome: () => void;
}

export const LocalPlayPage: React.FC<LocalPlayPageProps> = ({ onReviewGame, onGoHome }) => {
  const [inSetup, setInSetup] = useState(true);
  const [whiteName, setWhiteName] = useState('Player 1');
  const [blackName, setBlackName] = useState('Player 2');
  const [timeControl, setTimeControl] = useState({ initialMinutes: 10, incrementSeconds: 0 });
  const [autoFlip, setAutoFlip] = useState(false);
  const [manualOrientation, setManualOrientation] = useState<PieceColor>('w');

  const [chess] = useState(() => new Chess());
  const [, setRenderTrigger] = useState(0);
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const [whiteTimeMs, setWhiteTimeMs] = useState(10 * 60 * 1000);
  const [blackTimeMs, setBlackTimeMs] = useState(10 * 60 * 1000);
  const [isClockRunning, setIsClockRunning] = useState(false);

  const [gameOverModal, setGameOverModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    result: '1-0' | '0-1' | '1/2-1/2' | '*';
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    result: '*',
  });

  const settings = storageService.getSettings();
  const isUnlimited = timeControl.initialMinutes === 0;

  // Clocks
  useEffect(() => {
    if (!isClockRunning || isUnlimited || gameOverModal.isOpen || inSetup) return;

    const interval = setInterval(() => {
      const turn = chess.turn();
      if (turn === 'w') {
        setWhiteTimeMs((t) => {
          if (t <= 100) {
            handleTimeout('w');
            return 0;
          }
          return t - 100;
        });
      } else {
        setBlackTimeMs((t) => {
          if (t <= 100) {
            handleTimeout('b');
            return 0;
          }
          return t - 100;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isClockRunning, chess, isUnlimited, gameOverModal.isOpen, inSetup]);

  const handleTimeout = (timedOutColor: PieceColor) => {
    setIsClockRunning(false);
    soundManager.playGameOver();
    const winner = timedOutColor === 'w' ? blackName : whiteName;
    const res = timedOutColor === 'w' ? '0-1' : '1-0';
    finishGame(res, 'Time Out', `${winner} wins on time.`);
  };

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (chess.isGameOver() || gameOverModal.isOpen) return;

    try {
      const moveRes = chess.move(move);
      if (moveRes) {
        setLastMove({ from: move.from, to: move.to });
        setMoves([...chess.history()]);
        setCurrentMoveIndex(chess.history().length - 1);
        setRenderTrigger((r) => r + 1);

        // Sound
        if (chess.isCheckmate() || chess.isDraw()) soundManager.playGameOver();
        else if (chess.inCheck()) soundManager.playCheck();
        else if (moveRes.captured) soundManager.playCapture();
        else if (moveRes.san.includes('O-O')) soundManager.playCastle();
        else if (moveRes.promotion) soundManager.playPromote();
        else soundManager.playMove();

        // Increment
        if (!isUnlimited && timeControl.incrementSeconds > 0) {
          if (moveRes.color === 'w') setWhiteTimeMs((t) => t + timeControl.incrementSeconds * 1000);
          else setBlackTimeMs((t) => t + timeControl.incrementSeconds * 1000);
        }

        if (!isClockRunning) setIsClockRunning(true);

        if (chess.isCheckmate()) {
          const winner = chess.turn() === 'w' ? blackName : whiteName;
          const res = chess.turn() === 'w' ? '0-1' : '1-0';
          finishGame(res, 'Checkmate', `${winner} wins by checkmate!`);
        } else if (chess.isDraw()) {
          finishGame('1/2-1/2', 'Draw', 'Game drawn by rule.');
        }
      }
    } catch {
      soundManager.playError();
    }
  };

  const finishGame = (result: '1-0' | '0-1' | '1/2-1/2' | '*', title: string, subtitle: string) => {
    setIsClockRunning(false);
    const opening = identifyOpening(chess.history());
    const saved: SavedGame = {
      id: `local_${Date.now()}`,
      date: new Date().toLocaleDateString(),
      whitePlayer: whiteName,
      blackPlayer: blackName,
      result,
      reason: subtitle,
      moves: chess.history(),
      pgn: chess.pgn(),
      initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      finalFen: chess.fen(),
      timeControl: isUnlimited ? 'Unlimited' : `${timeControl.initialMinutes}+${timeControl.incrementSeconds}`,
      gameMode: 'local',
      opening: opening ? { name: opening.name, eco: opening.eco } : undefined,
    };
    storageService.saveGame(saved);

    setGameOverModal({
      isOpen: true,
      title,
      subtitle,
      result,
    });
  };

  const handleResign = () => {
    const winner = chess.turn() === 'w' ? blackName : whiteName;
    const res = chess.turn() === 'w' ? '0-1' : '1-0';
    soundManager.playGameOver();
    finishGame(res, 'Resignation', `${winner} won by resignation.`);
  };

  const handleDraw = () => {
    soundManager.playGameOver();
    finishGame('1/2-1/2', 'Draw Agreed', 'Both players agreed to a draw.');
  };

  const startNewLocalMatch = () => {
    chess.reset();
    setMoves([]);
    setCurrentMoveIndex(-1);
    setLastMove(null);
    setWhiteTimeMs(timeControl.initialMinutes * 60 * 1000);
    setBlackTimeMs(timeControl.initialMinutes * 60 * 1000);
    setIsClockRunning(false);
    setGameOverModal({ isOpen: false, title: '', subtitle: '', result: '*' });
    setInSetup(false);
    soundManager.playGameStart();
  };

  const currentOrientation = autoFlip ? chess.turn() : manualOrientation;

  if (inSetup) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 animate-in fade-in">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-black text-zinc-100 uppercase tracking-wide">
              Local 1v1 Pass & Play
            </h1>
            <p className="text-xs text-zinc-400">Play two players on a single shared device.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-400 block mb-1">
                White Player Name
              </label>
              <input
                type="text"
                value={whiteName}
                onChange={(e) => setWhiteName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-400 block mb-1">
                Black Player Name
              </label>
              <input
                type="text"
                value={blackName}
                onChange={(e) => setBlackName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-400 block">Time Control</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Blitz 3+2', min: 3, inc: 2 },
                { name: 'Blitz 5+0', min: 5, inc: 0 },
                { name: 'Rapid 10+0', min: 10, inc: 0 },
                { name: 'Unlimited', min: 0, inc: 0 },
              ].map((tc) => (
                <button
                  key={tc.name}
                  onClick={() => setTimeControl({ initialMinutes: tc.min, incrementSeconds: tc.inc })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    timeControl.initialMinutes === tc.min && timeControl.incrementSeconds === tc.inc
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {tc.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startNewLocalMatch}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start 1v1 Match</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in">
      <GameClock
        whiteTimeMs={whiteTimeMs}
        blackTimeMs={blackTimeMs}
        activeColor={isClockRunning ? chess.turn() : null}
        whiteName={whiteName}
        blackName={blackName}
        isUnlimited={isUnlimited}
      />

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="flex flex-col items-center gap-3 w-full max-w-[560px]">
          <ChessBoard
            chess={chess}
            orientation={currentOrientation}
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            showCoordinates={settings.showCoordinates}
            showLegalMoves={settings.showLegalMoves}
            showLastMoveHighlight={settings.showLastMoveHighlight}
            onMove={handleMove}
            lastMove={lastMove}
          />

          <div className="w-full grid grid-cols-4 gap-2 select-none">
            <button
              onClick={() => setManualOrientation((o) => (o === 'w' ? 'b' : 'w'))}
              className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>Flip</span>
            </button>

            <button
              onClick={handleDraw}
              disabled={chess.isGameOver()}
              className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Draw</span>
            </button>

            <button
              onClick={handleResign}
              disabled={chess.isGameOver()}
              className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Resign</span>
            </button>

            <button
              onClick={() => setInSetup(true)}
              className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-amber-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Setup</span>
            </button>
          </div>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-3">
          <MoveHistory
            moves={moves}
            currentMoveIndex={currentMoveIndex}
            onSelectMove={(idx) => setCurrentMoveIndex(idx)}
            onFirst={() => setCurrentMoveIndex(-1)}
            onPrev={() => setCurrentMoveIndex((idx) => Math.max(-1, idx - 1))}
            onNext={() => setCurrentMoveIndex((idx) => Math.min(moves.length - 1, idx + 1))}
            onLast={() => setCurrentMoveIndex(moves.length - 1)}
          />
        </div>
      </div>

      <GameOverModal
        isOpen={gameOverModal.isOpen}
        title={gameOverModal.title}
        subtitle={gameOverModal.subtitle}
        onNewGame={() => setInSetup(true)}
        onReviewGame={() => {
          const lastSaved = storageService.getSavedGames()[0];
          if (lastSaved && onReviewGame) onReviewGame(lastSaved);
        }}
        onGoHome={onGoHome}
      />
    </div>
  );
};
