import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard, BoardArrow } from '../../components/ChessBoard/ChessBoard';
import { EvaluationBar } from '../../components/EvaluationBar/EvaluationBar';
import { stockfishEngine } from '../../engine/StockfishEngine';
import { classifyMove } from '../../analysis/moveClassification';
import { calculateGameReview } from '../../analysis/accuracyCalculator';
import { explainMove } from '../../analysis/tacticalExplanations';
import { storageService } from '../../services/StorageService';
import {
  SavedGame,
  MoveAnalysis,
  MoveClassification,
  MoveClassificationType,
  EvaluationResult,
  PieceColor,
} from '../../types/chess';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Award,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface GameReviewPageProps {
  game?: SavedGame | null;
  onGoBack: () => void;
}

export const GameReviewPage: React.FC<GameReviewPageProps> = ({ game, onGoBack }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyses, setAnalyses] = useState<MoveAnalysis[]>(game?.analyses || []);
  const [currentPly, setCurrentPly] = useState(0); // 0 = startpos, 1 = move 1...
  const [whiteAccuracy, setWhiteAccuracy] = useState(game?.accuracy?.white ?? 84);
  const [blackAccuracy, setBlackAccuracy] = useState(game?.accuracy?.black ?? 81);

  // Replay board state
  const [chess] = useState(() => new Chess());
  const [, setRenderTrigger] = useState(0);

  const settings = storageService.getSettings();
  const moves = game?.moves || [];

  // Initialize engine and analyze game if not already analyzed
  useEffect(() => {
    if (!game || game.moves.length === 0) return;

    if (game.analyses && game.analyses.length === game.moves.length) {
      setAnalyses(game.analyses);
      return;
    }

    // Run deep analysis
    let isCancelled = false;
    const runDeepAnalysis = async () => {
      setAnalyzing(true);
      await stockfishEngine.initialize();

      const tempChess = new Chess();
      const collected: MoveAnalysis[] = [];
      let prevEval = 20; // Slight white initial advantage

      for (let i = 0; i < moves.length; i++) {
        if (isCancelled) break;
        const san = moves[i];
        const fenBefore = tempChess.fen();
        const moveRes = tempChess.move(san);
        const fenAfter = tempChess.fen();

        // Stockfish evaluation on fenAfter
        const evalRes = await new Promise<EvaluationResult>((resolve) => {
          stockfishEngine.analyze(fenAfter, 10, (res) => resolve(res));
        });

        const currentEval = evalRes.score;
        const bestMove = evalRes.bestMove || '0000';
        const bestMoveSan = evalRes.bestMoveSan || '';

        const color: PieceColor = (moveRes?.color || 'w') as PieceColor;
        const classResult = classifyMove(
          color,
          prevEval,
          currentEval,
          currentEval,
          false
        );

        const explanation = explainMove(fenBefore, bestMove);

        const analysis: MoveAnalysis = {
          moveNumber: Math.floor(i / 2) + 1,
          color,
          san,
          uci: bestMove,
          from: moveRes?.from || '',
          to: moveRes?.to || '',
          fenBefore,
          fenAfter,
          evaluationBefore: prevEval,
          evaluationAfter: currentEval,
          bestMove,
          bestMoveSan,
          classification: classResult.classification,
          centipawnLoss: classResult.centipawnLoss,
          explanation:
            classResult.classification === MoveClassification.BLUNDER ||
            classResult.classification === MoveClassification.MISTAKE
              ? explanation.rationale
              : undefined,
        };

        collected.push(analysis);
        prevEval = currentEval;
        setProgress(Math.round(((i + 1) / moves.length) * 100));
      }

      if (!isCancelled) {
        setAnalyses(collected);
        const review = calculateGameReview(collected);
        setWhiteAccuracy(review.whiteAccuracy);
        setBlackAccuracy(review.blackAccuracy);

        // Update stored game
        storageService.updateGameAnalysis(game.id, review);
        setAnalyzing(false);
      }
    };

    runDeepAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [game]);

  // Navigate to ply
  const goToPly = (targetPly: number) => {
    const clamped = Math.max(0, Math.min(moves.length, targetPly));
    setCurrentPly(clamped);

    chess.reset();
    for (let i = 0; i < clamped; i++) {
      chess.move(moves[i]);
    }
    setRenderTrigger((r) => r + 1);
  };

  const currentAnalysis = currentPly > 0 ? analyses[currentPly - 1] : null;

  // Move classification badge styles
  const getBadgeStyle = (classification?: MoveClassificationType) => {
    switch (classification) {
      case 'brilliant':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'excellent':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'good':
        return 'bg-lime-500/15 text-lime-400 border-lime-500/30';
      case 'book':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'inaccuracy':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'mistake':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'blunder':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  // Move counts summary
  const getClassificationCounts = (color: 'w' | 'b') => {
    const colorAnalyses = analyses.filter((a) => a.color === color);
    return {
      brilliant: colorAnalyses.filter((a) => a.classification === 'brilliant').length,
      best: colorAnalyses.filter((a) => a.classification === 'excellent').length,
      good: colorAnalyses.filter((a) => a.classification === 'good').length,
      inaccuracy: colorAnalyses.filter((a) => a.classification === 'inaccuracy').length,
      mistake: colorAnalyses.filter((a) => a.classification === 'mistake').length,
      blunder: colorAnalyses.filter((a) => a.classification === 'blunder').length,
    };
  };

  const whiteCounts = getClassificationCounts('w');
  const blackCounts = getClassificationCounts('b');

  // Key turning points (blunders and mistakes)
  const turningPoints = analyses
    .filter(
      (a) =>
        a.classification === MoveClassification.BLUNDER ||
        a.classification === MoveClassification.MISTAKE ||
        a.classification === MoveClassification.BRILLIANT
    )
    .slice(0, 8);

  const arrows: BoardArrow[] = [];
  if (currentAnalysis && currentAnalysis.bestMove && currentAnalysis.bestMove.length >= 4) {
    arrows.push({
      from: currentAnalysis.bestMove.slice(0, 2),
      to: currentAnalysis.bestMove.slice(2, 4),
      color: '#10B981', // green arrow for the engine's suggested best move
    });
  }

  const currentEvalResult: EvaluationResult = {
    score: currentAnalysis ? currentAnalysis.evaluation : 0,
    isMate: false,
    depth: 10,
    bestMove: currentAnalysis?.bestMove || '',
    pv: [],
    winProbabilityWhite: 50,
    winProbabilityBlack: 50,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoBack}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Full Game Review</span>
            </h1>
            <p className="text-xs text-zinc-400">
              {game?.whitePlayer || 'White'} vs {game?.blackPlayer || 'Black'} • {moves.length} moves • {game?.result || '*'}
            </p>
          </div>
        </div>

        {analyzing && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Analyzing moves with Stockfish ({progress}%)...</span>
          </div>
        )}
      </div>

      {/* Accuracy Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-200 block">{game?.whitePlayer || 'White'}</span>
            <span className="text-[11px] text-zinc-500">White Accuracy</span>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black font-mono text-emerald-400">{whiteAccuracy}%</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-zinc-200 block">{game?.blackPlayer || 'Black'}</span>
            <span className="text-[11px] text-zinc-500">Black Accuracy</span>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black font-mono text-cyan-400">{blackAccuracy}%</span>
          </div>
        </div>
      </div>

      {/* Interactive Evaluation Graph */}
      {analyses.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Advantage Chart (Click bar to jump)</span>
            </span>
            <span className="text-[11px] text-zinc-500">
              Ply {currentPly} of {moves.length}
            </span>
          </div>

          {/* Centipawn sparkline / bars */}
          <div className="h-20 bg-zinc-950/80 rounded-xl p-2 border border-zinc-800 flex items-center gap-0.5 overflow-x-auto">
            {analyses.map((a, idx) => {
              const heightPct = Math.min(100, Math.max(10, Math.abs(a.evaluation) / 5));
              const isWhiteAdvantage = a.evaluation >= 0;
              const isSelected = currentPly === idx + 1;

              return (
                <button
                  key={idx}
                  onClick={() => goToPly(idx + 1)}
                  title={`Move ${Math.ceil((idx + 1) / 2)}${a.color === 'w' ? '.' : '...'}${a.san} (${a.evaluation / 100} cp)`}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 min-w-[5px] rounded-xs transition-all ${
                    isSelected
                      ? 'bg-amber-400 ring-2 ring-amber-300'
                      : isWhiteAdvantage
                      ? 'bg-zinc-200 hover:bg-zinc-100'
                      : 'bg-zinc-600 hover:bg-zinc-500'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Board & Review Controls */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="hidden sm:block h-[500px]">
          <EvaluationBar evaluation={currentEvalResult} orientation={game?.playerColor || 'w'} />
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-[500px]">
          <ChessBoard
            chess={chess}
            orientation={game?.playerColor || 'w'}
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            arrows={arrows}
            disabled={true}
          />

          {/* Stepper Navigation */}
          <div className="w-full flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 select-none">
            <button
              onClick={() => goToPly(0)}
              disabled={currentPly === 0}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPly(currentPly - 1)}
              disabled={currentPly === 0}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold text-zinc-300">
              Move {currentPly > 0 ? `${Math.ceil(currentPly / 2)}${currentPly % 2 === 1 ? '.' : '...'}` : 'Start'}
            </span>

            <button
              onClick={() => goToPly(currentPly + 1)}
              disabled={currentPly >= moves.length}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPly(moves.length)}
              disabled={currentPly >= moves.length}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Current Move Details & Key Moments */}
        <div className="w-full lg:w-96 space-y-4">
          {/* Current Move Explanation Card */}
          {currentAnalysis ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-100 font-mono">
                    {Math.ceil(currentPly / 2)}
                    {currentAnalysis.color === 'w' ? '.' : '...'} {currentAnalysis.san}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border uppercase font-bold ${getBadgeStyle(
                      currentAnalysis.classification
                    )}`}
                  >
                    {currentAnalysis.classification}
                  </span>
                </div>

                <span className="text-xs font-mono font-semibold text-zinc-400">
                  Eval: {(currentAnalysis.evaluation / 100).toFixed(2)}
                </span>
              </div>

              {/* Best Move Suggestion */}
              {currentAnalysis.bestMoveSan && currentAnalysis.bestMoveSan !== currentAnalysis.san && (
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Better Move: {currentAnalysis.bestMoveSan}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Engine suggests {currentAnalysis.bestMoveSan} which retains advantage.
                  </p>
                </div>
              )}

              {/* Tactical Explanation */}
              {currentAnalysis.explanation && (
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Tactical Insight</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {currentAnalysis.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-xs text-zinc-400">
              Select any move above or use the arrows to begin the review walk-through.
            </div>
          )}

          {/* Key Turning Points */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Key Moments & Turning Points</span>
            </h3>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {turningPoints.map((tp, idx) => (
                <div
                  key={idx}
                  onClick={() => goToPly(tp.ply)}
                  className="p-2 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 cursor-pointer flex items-center justify-between transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-300">
                      {Math.ceil(tp.ply / 2)}
                      {tp.color === 'w' ? '.' : '...'} {tp.san}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border uppercase font-bold ${getBadgeStyle(
                        tp.classification
                      )}`}
                    >
                      {tp.classification}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-500 font-mono">
                    Loss: {tp.centipawnLoss} cp
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
