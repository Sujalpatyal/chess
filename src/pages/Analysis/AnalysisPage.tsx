import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard, BoardArrow } from '../../components/ChessBoard/ChessBoard';
import { EvaluationBar } from '../../components/EvaluationBar/EvaluationBar';
import { MoveHistory } from '../../components/MoveHistory/MoveHistory';
import { EnginePanel } from '../../components/EnginePanel/EnginePanel';
import { PgnModal } from '../../components/Modal/PgnModal';
import { stockfishEngine } from '../../engine/StockfishEngine';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { explainMove } from '../../analysis/tacticalExplanations';
import { EvaluationResult, PieceColor } from '../../types/chess';
import {
  FlipVertical,
  RotateCcw,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const [chess] = useState(() => new Chess());
  const [, setRenderTrigger] = useState(0);
  const [orientation, setOrientation] = useState<PieceColor>('w');
  const [moves, setMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
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
  const [engineDepth, setEngineDepth] = useState(14);
  const [isEngineActive, setIsEngineActive] = useState(true);

  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState('');
  const [hintSquare, setHintSquare] = useState<string | undefined>(undefined);

  const [isPgnModalOpen, setIsPgnModalOpen] = useState(false);
  const [fenCopied, setFenCopied] = useState(false);

  const settings = storageService.getSettings();

  useEffect(() => {
    stockfishEngine.initialize();
  }, []);

  const runEvaluation = useCallback((fen: string) => {
    if (!isEngineActive) return;
    stockfishEngine.analyze(fen, engineDepth, (res) => {
      setEvaluation(res);
    });
  }, [isEngineActive, engineDepth]);

  useEffect(() => {
    runEvaluation(chess.fen());
  }, [chess, runEvaluation]);

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    try {
      const res = chess.move(move);
      if (res) {
        setLastMove({ from: move.from, to: move.to });
        setMoves([...chess.history()]);
        setCurrentMoveIndex(chess.history().length - 1);
        setRenderTrigger((r) => r + 1);

        if (chess.isCheckmate() || chess.isDraw()) soundManager.playGameOver();
        else if (chess.inCheck()) soundManager.playCheck();
        else if (res.captured) soundManager.playCapture();
        else soundManager.playMove();

        setHintLevel(0);
        setHintText('');
        setHintSquare(undefined);
        runEvaluation(chess.fen());
      }
    } catch {
      soundManager.playError();
    }
  };

  const handleSelectMove = (index: number) => {
    const tempChess = new Chess();
    for (let i = 0; i <= index; i++) {
      tempChess.move(moves[i]);
    }
    chess.load(tempChess.fen());
    setCurrentMoveIndex(index);
    setRenderTrigger((r) => r + 1);
    runEvaluation(chess.fen());
  };

  const handleReset = () => {
    chess.reset();
    setMoves([]);
    setCurrentMoveIndex(-1);
    setLastMove(null);
    setRenderTrigger((r) => r + 1);
    runEvaluation(chess.fen());
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(chess.fen());
    setFenCopied(true);
    setTimeout(() => setFenCopied(false), 2000);
  };

  const handleImportPgn = (pgn: string) => {
    try {
      chess.loadPgn(pgn);
      setMoves([...chess.history()]);
      setCurrentMoveIndex(chess.history().length - 1);
      setRenderTrigger((r) => r + 1);
      runEvaluation(chess.fen());
    } catch {
      soundManager.playError();
    }
  };

  const handleRequestHint = () => {
    const best = evaluation.bestMove;
    if (!best) return;
    const exp = explainMove(chess.fen(), best);
    const next = (hintLevel + 1) % 4;
    setHintLevel(next);
    if (next === 1) { setHintText(exp.level1Hint); setHintSquare(exp.from); }
    else if (next === 2) { setHintText(exp.level2Hint); setHintSquare(exp.to); }
    else if (next === 3) { setHintText(exp.level3Hint); setHintSquare(undefined); }
    else { setHintText(''); setHintSquare(undefined); }
  };

  const arrows: BoardArrow[] = [];
  if (isEngineActive && evaluation.bestMove && evaluation.bestMove.length >= 4) {
    arrows.push({
      from: evaluation.bestMove.slice(0, 2),
      to: evaluation.bestMove.slice(2, 4),
      color: '#10B981',
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-100 uppercase tracking-wide">
            Analysis Board
          </h1>
          <p className="text-xs text-zinc-400">
            Explore moves and test variations with Stockfish UCI analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyFen}
            className="py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            {fenCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{fenCopied ? 'FEN Copied' : 'Copy FEN'}</span>
          </button>

          <button
            onClick={() => setIsPgnModalOpen(true)}
            className="py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-amber-400 flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PGN Tools</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="hidden sm:block h-[560px]">
          <EvaluationBar evaluation={evaluation} orientation={orientation} />
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-[560px]">
          <ChessBoard
            chess={chess}
            orientation={orientation}
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            showCoordinates={settings.showCoordinates}
            showLegalMoves={settings.showLegalMoves}
            showLastMoveHighlight={settings.showLastMoveHighlight}
            arrows={arrows}
            hintSquare={hintSquare}
            onMove={handleMove}
            lastMove={lastMove}
          />

          <div className="w-full grid grid-cols-3 gap-2 select-none">
            <button
              onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>Flip Board</span>
            </button>

            <button
              onClick={handleReset}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Board</span>
            </button>

            <button
              onClick={() => setIsEngineActive(!isEngineActive)}
              className={`py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isEngineActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {isEngineActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isEngineActive ? 'Engine ON' : 'Engine OFF'}</span>
            </button>
          </div>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-3">
          <EnginePanel
            evaluation={evaluation}
            isEngineActive={isEngineActive}
            onToggleEngine={() => setIsEngineActive(!isEngineActive)}
            bestMoveSan={evaluation.bestMoveSan}
            depth={engineDepth}
            onSelectDepth={setEngineDepth}
            hintLevel={hintLevel}
            hintText={hintText}
            onRequestHint={handleRequestHint}
          />

          <MoveHistory
            moves={moves}
            currentMoveIndex={currentMoveIndex}
            onSelectMove={handleSelectMove}
            onFirst={() => handleSelectMove(-1)}
            onPrev={() => handleSelectMove(Math.max(-1, currentMoveIndex - 1))}
            onNext={() => handleSelectMove(Math.min(moves.length - 1, currentMoveIndex + 1))}
            onLast={() => handleSelectMove(moves.length - 1)}
          />
        </div>
      </div>

      <PgnModal
        isOpen={isPgnModalOpen}
        onClose={() => setIsPgnModalOpen(false)}
        currentPgn={chess.pgn()}
        onImportPgn={handleImportPgn}
      />
    </div>
  );
};
