import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '../../components/ChessBoard/ChessBoard';
import { EvaluationBar } from '../../components/EvaluationBar/EvaluationBar';
import { MoveHistory } from '../../components/MoveHistory/MoveHistory';
import { stockfishEngine } from '../../engine/StockfishEngine';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { EvaluationResult, PieceColor } from '../../types/chess';
import { Play, Pause, RotateCcw, FastForward, Tv } from 'lucide-react';

export const AiVsAiPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1000);
  const [whiteDifficulty, setWhiteDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('advanced');
  const [blackDifficulty, setBlackDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');

  const [chess] = useState(() => new Chess());
  const [, setRenderTrigger] = useState(0);
  const [moves, setMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const [evaluation, setEvaluation] = useState<EvaluationResult>({
    score: 0,
    isMate: false,
    depth: 1,
    bestMove: '',
    pv: [],
    winProbabilityWhite: 50,
    winProbabilityBlack: 50,
  });

  const settings = storageService.getSettings();
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  useEffect(() => {
    stockfishEngine.initialize();
  }, []);

  useEffect(() => {
    let timeout: any;
    if (isPlaying && !chess.isGameOver()) {
      timeout = setTimeout(makeNextAiMove, speedMs);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, moves, speedMs]);

  const makeNextAiMove = async () => {
    if (!playingRef.current || chess.isGameOver()) {
      setIsPlaying(false);
      return;
    }

    const turn = chess.turn();
    const currentDiff = turn === 'w' ? whiteDifficulty : blackDifficulty;
    let depth = 6;
    if (currentDiff === 'beginner') depth = 4;
    else if (currentDiff === 'intermediate') depth = 8;
    else if (currentDiff === 'advanced') depth = 12;
    else if (currentDiff === 'expert') depth = 16;

    const bestMove = await stockfishEngine.getBestMove(chess.fen(), depth, Math.min(speedMs * 0.7, 800));
    if (!bestMove || bestMove === '0000' || !playingRef.current) return;

    try {
      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      const promotion = bestMove[4] || undefined;

      const res = chess.move({ from, to, promotion });
      if (res) {
        setLastMove({ from, to });
        setMoves([...chess.history()]);
        setRenderTrigger((r) => r + 1);

        if (chess.isCheckmate() || chess.isDraw()) {
          soundManager.playGameOver();
          setIsPlaying(false);
        } else if (res.captured) {
          soundManager.playCapture();
        } else {
          soundManager.playMove();
        }

        // Quick eval
        stockfishEngine.analyze(chess.fen(), 8, (eRes) => setEvaluation(eRes));
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    chess.reset();
    setMoves([]);
    setLastMove(null);
    setRenderTrigger((r) => r + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <Tv className="w-5 h-5 text-amber-400" />
            <span>AI vs AI Spectator Stream</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Watch two automated Stockfish engines play head-to-head.
          </p>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 font-semibold">Speed:</span>
          {[
            { label: '0.5s', ms: 500 },
            { label: '1s', ms: 1000 },
            { label: '2s', ms: 2000 },
          ].map((s) => (
            <button
              key={s.ms}
              onClick={() => setSpeedMs(s.ms)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                speedMs === s.ms
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-200 block">White AI Bot</span>
            <span className="text-[11px] text-zinc-500">Difficulty Level</span>
          </div>
          <select
            value={whiteDifficulty}
            onChange={(e: any) => setWhiteDifficulty(e.target.value)}
            disabled={isPlaying}
            className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="beginner">Beginner (~1100)</option>
            <option value="intermediate">Intermediate (~1500)</option>
            <option value="advanced">Advanced (~2000)</option>
            <option value="expert">Expert (~2600)</option>
          </select>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-200 block">Black AI Bot</span>
            <span className="text-[11px] text-zinc-500">Difficulty Level</span>
          </div>
          <select
            value={blackDifficulty}
            onChange={(e: any) => setBlackDifficulty(e.target.value)}
            disabled={isPlaying}
            className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="beginner">Beginner (~1100)</option>
            <option value="intermediate">Intermediate (~1500)</option>
            <option value="advanced">Advanced (~2000)</option>
            <option value="expert">Expert (~2600)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="hidden sm:block h-[500px]">
          <EvaluationBar evaluation={evaluation} orientation="w" />
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-[500px]">
          <ChessBoard
            chess={chess}
            orientation="w"
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            lastMove={lastMove}
            disabled={true}
          />

          <div className="w-full grid grid-cols-2 gap-2 select-none">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/10"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-zinc-950" />}
              <span>{isPlaying ? 'Pause Match' : 'Play / Stream'}</span>
            </button>

            <button
              onClick={handleReset}
              className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Game</span>
            </button>
          </div>
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
