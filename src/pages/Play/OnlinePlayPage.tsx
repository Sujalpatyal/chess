import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { io, Socket } from 'socket.io-client';
import { ChessBoard } from '../../components/ChessBoard/ChessBoard';
import { MoveHistory } from '../../components/MoveHistory/MoveHistory';
import { GameClock } from '../../components/GameClock/GameClock';
import { GameOverModal } from '../../components/Modal/GameOverModal';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { PieceColor, SavedGame } from '../../types/chess';
import { Copy, Check, Users, Globe, Wifi, WifiOff, Flag, Handshake } from 'lucide-react';

interface OnlinePlayPageProps {
  onReviewGame?: (game: SavedGame) => void;
  onGoHome: () => void;
}

export const OnlinePlayPage: React.FC<OnlinePlayPageProps> = ({ onReviewGame, onGoHome }) => {
  const [inLobby, setInLobby] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [displayName, setDisplayName] = useState(storageService.getSettings().displayName);
  const [assignedColor, setAssignedColor] = useState<PieceColor>('w');
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [isConnected, setIsConnected] = useState(false);
  const [isOpponentConnected, setIsOpponentConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [chess] = useState(() => new Chess());
  const [, setRenderTrigger] = useState(0);
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const [whiteTimeMs, setWhiteTimeMs] = useState(600000);
  const [blackTimeMs, setBlackTimeMs] = useState(600000);
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

  const socketRef = useRef<Socket | null>(null);
  const settings = storageService.getSettings();

  // Connect to Socket.IO server
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setErrorMessage(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setErrorMessage('Unable to connect to multiplayer server. Please check your connection.');
    });

    socket.on('room_created', (data: { roomCode: string; color: PieceColor }) => {
      setRoomCode(data.roomCode);
      setAssignedColor(data.color);
      setInLobby(false);
    });

    socket.on('game_start', (data: { opponentName: string; color: PieceColor; timeMs: number }) => {
      setOpponentName(data.opponentName);
      setAssignedColor(data.color);
      setWhiteTimeMs(data.timeMs);
      setBlackTimeMs(data.timeMs);
      setIsOpponentConnected(true);
      setInLobby(false);
      chess.reset();
      setMoves([]);
      setCurrentMoveIndex(-1);
      setLastMove(null);
      soundManager.playGameStart();
      setRenderTrigger((r) => r + 1);
    });

    socket.on('opponent_move', (data: { move: { from: string; to: string; promotion?: string }; fen: string }) => {
      try {
        const moveRes = chess.move(data.move);
        if (moveRes) {
          setLastMove({ from: data.move.from, to: data.move.to });
          setMoves([...chess.history()]);
          setCurrentMoveIndex(chess.history().length - 1);
          setRenderTrigger((r) => r + 1);

          if (chess.isCheckmate() || chess.isDraw()) soundManager.playGameOver();
          else if (chess.inCheck()) soundManager.playCheck();
          else if (moveRes.captured) soundManager.playCapture();
          else soundManager.playMove();

          if (!isClockRunning) setIsClockRunning(true);
        }
      } catch (err) {
        console.warn('Failed to apply opponent move:', err);
      }
    });

    socket.on('clock_sync', (data: { whiteTimeMs: number; blackTimeMs: number }) => {
      setWhiteTimeMs(data.whiteTimeMs);
      setBlackTimeMs(data.blackTimeMs);
    });

    socket.on('opponent_resigned', () => {
      soundManager.playGameOver();
      const res = assignedColor === 'w' ? '1-0' : '0-1';
      finishGame(res, 'Resignation', `${opponentName} resigned. You win!`);
    });

    socket.on('draw_offered', () => {
      if (window.confirm(`${opponentName} offered a draw. Accept?`)) {
        socket.emit('draw_response', { roomCode, accept: true });
        finishGame('1/2-1/2', 'Draw', 'Draw agreed by mutual consent.');
      } else {
        socket.emit('draw_response', { roomCode, accept: false });
      }
    });

    socket.on('draw_accepted', () => {
      finishGame('1/2-1/2', 'Draw', 'Opponent accepted your draw offer.');
    });

    socket.on('draw_declined', () => {
      alert(`${opponentName} declined your draw offer.`);
    });

    socket.on('opponent_disconnected', () => {
      setIsOpponentConnected(false);
    });

    socket.on('opponent_reconnected', () => {
      setIsOpponentConnected(true);
    });

    socket.on('error_message', (msg: string) => {
      setErrorMessage(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateRoom = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('create_room', {
      displayName: displayName.trim() || 'Player',
      timeMinutes: 10,
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socketRef.current || !joinCodeInput.trim()) return;
    const code = joinCodeInput.trim().toUpperCase();
    setRoomCode(code);
    socketRef.current.emit('join_room', {
      roomCode: code,
      displayName: displayName.trim() || 'Player',
    });
  };

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (chess.turn() !== assignedColor || chess.isGameOver()) return;

    try {
      const moveRes = chess.move(move);
      if (moveRes) {
        setLastMove({ from: move.from, to: move.to });
        setMoves([...chess.history()]);
        setCurrentMoveIndex(chess.history().length - 1);
        setRenderTrigger((r) => r + 1);

        if (chess.isCheckmate() || chess.isDraw()) soundManager.playGameOver();
        else if (chess.inCheck()) soundManager.playCheck();
        else if (moveRes.captured) soundManager.playCapture();
        else soundManager.playMove();

        if (!isClockRunning) setIsClockRunning(true);

        socketRef.current?.emit('make_move', {
          roomCode,
          move,
          fen: chess.fen(),
        });

        if (chess.isCheckmate()) {
          const res = assignedColor === 'w' ? '1-0' : '0-1';
          finishGame(res, 'Checkmate', 'You won by checkmate!');
        } else if (chess.isDraw()) {
          finishGame('1/2-1/2', 'Draw', 'Game ended in a draw.');
        }
      }
    } catch {
      soundManager.playError();
    }
  };

  const finishGame = (result: '1-0' | '0-1' | '1/2-1/2' | '*', title: string, subtitle: string) => {
    setIsClockRunning(false);
    const saved: SavedGame = {
      id: `online_${Date.now()}`,
      date: new Date().toLocaleDateString(),
      whitePlayer: assignedColor === 'w' ? displayName : opponentName,
      blackPlayer: assignedColor === 'b' ? displayName : opponentName,
      result,
      reason: subtitle,
      moves: chess.history(),
      pgn: chess.pgn(),
      initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      finalFen: chess.fen(),
      timeControl: '10+0',
      gameMode: 'online',
      playerColor: assignedColor,
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
    if (!socketRef.current) return;
    socketRef.current.emit('resign', { roomCode });
    const res = assignedColor === 'w' ? '0-1' : '1-0';
    finishGame(res, 'Resignation', 'You resigned the game.');
  };

  const handleOfferDraw = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('offer_draw', { roomCode });
    alert('Draw offer sent to opponent.');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inLobby) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 animate-in fade-in">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center mb-2">
              <Globe className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-zinc-100 uppercase tracking-wide">
              Online Multiplayer
            </h1>
            <p className="text-xs text-zinc-400">Play remotely using a private 6-character room code.</p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs text-center">
              {errorMessage}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-400 block mb-1">
                Your Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={16}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <Users className="w-4 h-4" />
              <span>Create New Private Game</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800" />
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-zinc-500">
              OR JOIN EXISTING
            </span>
            <div className="flex-grow border-t border-zinc-800" />
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-400 block mb-1">
                Enter Room Code
              </label>
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. A7K29P"
                maxLength={6}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono text-center uppercase tracking-widest text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={!joinCodeInput.trim()}
              className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 font-bold text-xs uppercase tracking-wide border border-zinc-700 transition-colors"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in">
      {/* Room code banner if waiting for opponent */}
      {!isOpponentConnected && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="text-xs font-bold text-emerald-400 block">
              Waiting for Opponent to Join...
            </span>
            <span className="text-xs text-zinc-300">
              Share this room code with your friend:{' '}
              <strong className="font-mono text-amber-400 text-sm tracking-wider">{roomCode}</strong>
            </span>
          </div>
          <button
            onClick={copyRoomCode}
            className="py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Code Copied' : 'Copy Code'}</span>
          </button>
        </div>
      )}

      {/* Opponent Connection Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {isConnected ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <Wifi className="w-3.5 h-3.5" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-400">
              <WifiOff className="w-3.5 h-3.5" /> Disconnected
            </span>
          )}
          <span>•</span>
          <span>Room: <strong className="font-mono text-zinc-200">{roomCode}</strong></span>
        </div>

        <span className="text-xs text-zinc-400">
          Playing as: <strong className="text-amber-400">{assignedColor === 'w' ? 'White' : 'Black'}</strong>
        </span>
      </div>

      <GameClock
        whiteTimeMs={whiteTimeMs}
        blackTimeMs={blackTimeMs}
        activeColor={isClockRunning ? chess.turn() : null}
        whiteName={assignedColor === 'w' ? displayName : opponentName}
        blackName={assignedColor === 'b' ? displayName : opponentName}
        isUnlimited={false}
      />

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="flex flex-col items-center gap-3 w-full max-w-[560px]">
          <ChessBoard
            chess={chess}
            orientation={assignedColor}
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            showCoordinates={settings.showCoordinates}
            showLegalMoves={settings.showLegalMoves}
            showLastMoveHighlight={settings.showLastMoveHighlight}
            disabled={chess.turn() !== assignedColor || !isOpponentConnected}
            onMove={handleMove}
            lastMove={lastMove}
          />

          <div className="w-full grid grid-cols-2 gap-2 select-none">
            <button
              onClick={handleOfferDraw}
              disabled={chess.isGameOver()}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Offer Draw</span>
            </button>

            <button
              onClick={handleResign}
              disabled={chess.isGameOver()}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Resign</span>
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
        onNewGame={() => setInLobby(true)}
        onReviewGame={() => {
          const last = storageService.getSavedGames()[0];
          if (last && onReviewGame) onReviewGame(last);
        }}
        onGoHome={onGoHome}
      />
    </div>
  );
};
