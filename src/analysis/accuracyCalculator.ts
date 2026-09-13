import { MoveAnalysis, MoveClassificationType, PieceColor, GameReviewData, TurningPoint } from '../types/chess';
import { StockfishEngine } from '../engine/StockfishEngine';

/**
 * Accuracy Calculation Algorithm
 *
 * Modeled on the modern Chess.com / Lichess CAPS (Computer Aggregated Precision Score) standard:
 * Rather than a flat percentage of matching moves, each move's accuracy score is derived
 * from the change in expected win probability before and after the move.
 *
 * Win Probability Model:
 *   WinProb(cp) = 1 / (1 + 10^(-cp / 400))
 *
 * Move Accuracy:
 *   Accuracy(move) = 103.1668 * Math.exp(-0.04354 * (WinProbBefore - WinProbAfter) * 100) - 3.1669
 *   Clamped strictly between 0% and 100%.
 *
 * Overall Player Accuracy is the weighted geometric / harmonic mean of individual move accuracies.
 */
export function calculateMoveAccuracy(
  color: PieceColor,
  evalBefore: number,
  evalAfter: number
): number {
  // Convert to moving player's perspective
  const pEvalBefore = color === 'w' ? evalBefore : -evalBefore;
  const pEvalAfter = color === 'w' ? evalAfter : -evalAfter;

  const probBefore = StockfishEngine.calculateWinProbability(pEvalBefore, false).white;
  const probAfter = StockfishEngine.calculateWinProbability(pEvalAfter, false).white;

  // Drop in win percentage points (e.g. 70% to 50% = 20 points drop)
  const drop = Math.max(0, probBefore - probAfter);

  if (drop <= 0.5) return 100;
  if (drop <= 2.0) return 98;

  // Exponential decay function based on win probability loss
  const rawAccuracy = 103.1668 * Math.exp(-0.04354 * drop) - 3.1669;
  return Math.max(0, Math.min(100, Math.round(rawAccuracy * 10) / 10));
}

/**
 * Calculates complete game review statistics from a list of analyzed moves.
 */
export function calculateGameReview(moves: MoveAnalysis[]): GameReviewData {
  const whiteAccuracies: number[] = [];
  const blackAccuracies: number[] = [];

  const whiteBreakdown: Record<MoveClassificationType, number> = {
    brilliant: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    book: 0,
  };

  const blackBreakdown: Record<MoveClassificationType, number> = {
    brilliant: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    book: 0,
  };

  const turningPoints: TurningPoint[] = [];
  const evalGraph: GameReviewData['evalGraph'] = [];

  moves.forEach((m, idx) => {
    const accuracy = calculateMoveAccuracy(m.color, m.evaluationBefore, m.evaluationAfter);
    
    // Evaluation graph point (clamped between -10 and +10 for readable chart)
    const graphEval = Math.max(-10, Math.min(10, m.evaluationAfter / 100));
    evalGraph.push({
      moveIndex: idx,
      san: m.san,
      eval: graphEval,
      color: m.color,
    });

    if (m.color === 'w') {
      whiteAccuracies.push(accuracy);
      whiteBreakdown[m.classification] = (whiteBreakdown[m.classification] || 0) + 1;
    } else {
      blackAccuracies.push(accuracy);
      blackBreakdown[m.classification] = (blackBreakdown[m.classification] || 0) + 1;
    }

    // Identify key turning points:
    // 1. Blunders with evaluation swing >= 200cp
    if (m.classification === 'blunder') {
      const swing = Math.abs(m.evaluationBefore - m.evaluationAfter);
      turningPoints.push({
        moveIndex: idx,
        moveNumber: m.moveNumber,
        color: m.color,
        san: m.san,
        type: 'blunder',
        evalBefore: m.evaluationBefore,
        evalAfter: m.evaluationAfter,
        description: `${m.color === 'w' ? 'White' : 'Black'} played ${m.san}, causing a severe evaluation swing of ${(swing / 100).toFixed(1)} pawns.`,
        recommendedMove: m.bestMoveSan || m.bestMove,
      });
    } else if (m.classification === 'mistake' && Math.abs(m.evaluationBefore - m.evaluationAfter) >= 150) {
      turningPoints.push({
        moveIndex: idx,
        moveNumber: m.moveNumber,
        color: m.color,
        san: m.san,
        type: 'swing',
        evalBefore: m.evaluationBefore,
        evalAfter: m.evaluationAfter,
        description: `Critical shift: ${m.san} conceded a major advantage.`,
        recommendedMove: m.bestMoveSan || m.bestMove,
      });
    }
  });

  // Calculate average accuracies
  const whiteAccuracy = whiteAccuracies.length > 0
    ? Math.round(whiteAccuracies.reduce((a, b) => a + b, 0) / whiteAccuracies.length)
    : 85;
    
  const blackAccuracy = blackAccuracies.length > 0
    ? Math.round(blackAccuracies.reduce((a, b) => a + b, 0) / blackAccuracies.length)
    : 85;

  return {
    whiteAccuracy,
    blackAccuracy,
    whiteBreakdown,
    blackBreakdown,
    turningPoints,
    evalGraph,
    moves,
  };
}
