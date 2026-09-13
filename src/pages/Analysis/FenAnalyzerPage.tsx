import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '../../components/ChessBoard/ChessBoard';
import { EvaluationBar } from '../../components/EvaluationBar/EvaluationBar';
import { stockfishEngine } from '../../engine/StockfishEngine';
import { storageService } from '../../services/StorageService';
import { EvaluationResult, PieceColor } from '../../types/chess';
import { Copy, Check, AlertCircle, Play, Compass, Cpu, Zap } from 'lucide-react';

export const FenAnalyzerPage: React.FC = () => {
  const [fenInput, setFenInput] = useState(
    'r1bqk2r/pppp1ppp/2n5/4p3/1bB1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 5'
  );
  const [chess, setChess] = useState(() => new Chess(fenInput));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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

  useEffect(() => {
    stockfishEngine.initialize();
  }, []);

  const evaluateFen = (fen: string) => {
    stockfishEngine.analyze(fen, 14, (res) => {
      setEvaluation(res);
    });
  };

  useEffect(() => {
    evaluateFen(chess.fen());
  }, [chess]);

  const handleApplyFen = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    try {
      const newChess = new Chess(fenInput.trim());
      setChess(newChess);
      evaluateFen(newChess.fen());
    } catch (err: any) {
      setError(err.message || 'Invalid FEN string. Please verify standard Forsyth-Edwards Notation.');
    }
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(chess.fen());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fenParts = chess.fen().split(' ');
  const sideToMove = fenParts[1] === 'w' ? 'White' : 'Black';
  const castlingRights = fenParts[2] || '-';
  const enPassant = fenParts[3] || '-';
  const halfmove = fenParts[4] || '0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="border-b border-zinc-800 pb-3">
        <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide">
          FEN Position Analyzer
        </h1>
        <p className="text-xs text-zinc-400">
          Load and inspect any Forsyth-Edwards Notation chess state.
        </p>
      </div>

      {/* FEN Input Form */}
      <form onSubmit={handleApplyFen} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <label className="text-xs font-bold uppercase text-zinc-400 block">
          Paste FEN String
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={fenInput}
            onChange={(e) => {
              setFenInput(e.target.value);
              setError(null);
            }}
            placeholder="Paste FEN here..."
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Analyze Position</span>
            </button>
            <button
              type="button"
              onClick={handleCopyFen}
              className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Main Board & Position Data */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="hidden sm:block h-[500px]">
          <EvaluationBar evaluation={evaluation} orientation={fenParts[1] as PieceColor} />
        </div>

        <div className="w-full max-w-[500px]">
          <ChessBoard
            chess={chess}
            orientation={fenParts[1] as PieceColor}
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            disabled={true}
          />
        </div>

        <div className="w-full lg:w-96 space-y-4">
          {/* Position Info Grid */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
              Position Parameters
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Side to Move</span>
                <span className="font-bold text-zinc-200">{sideToMove}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Castling</span>
                <span className="font-bold font-mono text-zinc-200">{castlingRights}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">En Passant</span>
                <span className="font-bold font-mono text-zinc-200">{enPassant}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Halfmove Clock</span>
                <span className="font-bold font-mono text-zinc-200">{halfmove}</span>
              </div>
            </div>
          </div>

          {/* Engine Analysis */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Stockfish Evaluation</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Score</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {evaluation.isMate ? `Mate in ${evaluation.mateIn}` : `${(evaluation.score / 100).toFixed(2)}`}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Search Depth</span>
                <span className="text-base font-bold font-mono text-zinc-200">
                  {evaluation.depth}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Best Move: {evaluation.bestMoveSan || evaluation.bestMove || '...'}</span>
              </div>
              {evaluation.pv.length > 0 && (
                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span className="truncate">Line: {evaluation.pv.slice(0, 6).join(' ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
