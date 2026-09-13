import { MoveClassificationType, PieceColor } from '../types/chess';

export interface ClassificationThresholds {
  brilliantAdvantageCap: number; // minimum eval after sacrifice
  excellentMaxLoss: number; // <= 15 cp loss
  goodMaxLoss: number; // <= 45 cp loss
  inaccuracyMaxLoss: number; // <= 100 cp loss
  mistakeMaxLoss: number; // <= 250 cp loss
  // > mistakeMaxLoss is Blunder
}

export const DEFAULT_THRESHOLDS: ClassificationThresholds = {
  brilliantAdvantageCap: 150,
  excellentMaxLoss: 15,
  goodMaxLoss: 45,
  inaccuracyMaxLoss: 100,
  mistakeMaxLoss: 250,
};

/**
 * Move Classification Algorithm
 *
 * Evaluates move quality based on centipawn loss compared to the engine's best move.
 *
 * - Brilliant: A piece sacrifice or unexpected tactical breakthrough that preserves or expands a winning edge.
 * - Excellent: Within 15 centipawns of the engine's top choice (near flawless).
 * - Good: A solid move with minor loss (16 - 45 centipawns).
 * - Inaccuracy: Suboptimal choice letting slip some advantage (46 - 100 centipawns).
 * - Mistake: Significant error substantially weakening the position (101 - 250 centipawns).
 * - Blunder: Critical catastrophic blunder losing decisive material or advantage (> 250 centipawns).
 */
export function classifyMove(
  color: PieceColor,
  evalBefore: number, // From White perspective (+ = White advantage)
  evalAfter: number,  // From White perspective
  bestEval: number,   // From White perspective
  isSacrifice: boolean = false,
  thresholds: ClassificationThresholds = DEFAULT_THRESHOLDS
): { classification: MoveClassificationType; centipawnLoss: number } {
  // Convert evaluations to moving player's perspective:
  // Positive means good for the player who just moved
  const playerEvalBefore = color === 'w' ? evalBefore : -evalBefore;
  const playerEvalAfter = color === 'w' ? evalAfter : -evalAfter;
  const playerBestEval = color === 'w' ? bestEval : -bestEval;

  // Centipawn loss is how much worse the position got relative to the best engine move
  let cpLoss = Math.max(0, playerBestEval - playerEvalAfter);

  // Check for Brilliant move:
  // A sacrifice where the position remains clearly favorable (eval > +150 cp) and cpLoss is minimal
  if (isSacrifice && playerEvalAfter >= thresholds.brilliantAdvantageCap && cpLoss <= thresholds.excellentMaxLoss) {
    return { classification: 'brilliant', centipawnLoss: cpLoss };
  }

  // Blunder threshold: huge drop or turning a winning position into lost
  if (playerEvalBefore > 150 && playerEvalAfter < -100) {
    return { classification: 'blunder', centipawnLoss: Math.max(cpLoss, 260) };
  }

  if (cpLoss <= thresholds.excellentMaxLoss) {
    return { classification: 'excellent', centipawnLoss: cpLoss };
  }
  if (cpLoss <= thresholds.goodMaxLoss) {
    return { classification: 'good', centipawnLoss: cpLoss };
  }
  if (cpLoss <= thresholds.inaccuracyMaxLoss) {
    return { classification: 'inaccuracy', centipawnLoss: cpLoss };
  }
  if (cpLoss <= thresholds.mistakeMaxLoss) {
    return { classification: 'mistake', centipawnLoss: cpLoss };
  }

  return { classification: 'blunder', centipawnLoss: cpLoss };
}

export function getClassificationColor(classification: MoveClassificationType): string {
  switch (classification) {
    case 'brilliant':
      return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50';
    case 'excellent':
      return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50';
    case 'good':
      return 'text-teal-400 bg-teal-950/60 border-teal-500/50';
    case 'inaccuracy':
      return 'text-amber-400 bg-amber-950/60 border-amber-500/50';
    case 'mistake':
      return 'text-orange-400 bg-orange-950/60 border-orange-500/50';
    case 'blunder':
      return 'text-rose-400 bg-rose-950/60 border-rose-500/50';
    case 'book':
      return 'text-blue-400 bg-blue-950/60 border-blue-500/50';
    default:
      return 'text-zinc-300 bg-zinc-800 border-zinc-700';
  }
}

export function getClassificationBadge(classification: MoveClassificationType): {
  label: string;
  icon: string;
  desc: string;
} {
  switch (classification) {
    case 'brilliant':
      return { label: 'Brilliant', icon: '!!', desc: 'A spectacular, winning sacrifice' };
    case 'excellent':
      return { label: 'Excellent', icon: '★', desc: 'The best or near-best move' };
    case 'good':
      return { label: 'Good', icon: '✓', desc: 'A solid, natural move' };
    case 'inaccuracy':
      return { label: 'Inaccuracy', icon: '?!', desc: 'Could be significantly improved' };
    case 'mistake':
      return { label: 'Mistake', icon: '?', desc: 'A weak move worsening the position' };
    case 'blunder':
      return { label: 'Blunder', icon: '??', desc: 'A serious oversight losing material or advantage' };
    case 'book':
      return { label: 'Book', icon: '📖', desc: 'Standard theoretical opening move' };
  }
}
