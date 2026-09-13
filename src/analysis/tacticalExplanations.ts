import { Chess } from 'chess.js';

export interface TacticalExplanation {
  pieceType: string;
  pieceName: string;
  from: string;
  to: string;
  isCapture: boolean;
  isCheck: boolean;
  isPromotion: boolean;
  isCastle: boolean;
  level1Hint: string; // The best piece to move
  level2Hint: string; // Target square
  level3Hint: string; // Full move + rationale
  rationale: string;
}

const PIECE_NAMES: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

/**
 * Derives factual chess tactical rationale and progressive hints from position and UCI move.
 */
export function explainMove(fen: string, uciMove: string): TacticalExplanation {
  const defaultExplanation: TacticalExplanation = {
    pieceType: 'p',
    pieceName: 'piece',
    from: '',
    to: '',
    isCapture: false,
    isCheck: false,
    isPromotion: false,
    isCastle: false,
    level1Hint: 'Consider looking at your active pieces.',
    level2Hint: 'Look for tactical tension on the board.',
    level3Hint: 'Play the top engine move.',
    rationale: 'Maintains optimal piece activity and central pressure.',
  };

  if (!fen || !uciMove || uciMove.length < 4) {
    return defaultExplanation;
  }

  try {
    const chess = new Chess(fen);
    const from = uciMove.slice(0, 2);
    const to = uciMove.slice(2, 4);
    const promo = uciMove[4] || undefined;

    const pieceObj = chess.get(from as any);
    const pieceType = pieceObj ? pieceObj.type : 'p';
    const pieceName = PIECE_NAMES[pieceType] || 'piece';

    const targetPiece = chess.get(to as any);
    const isCapture = !!targetPiece || (pieceType === 'p' && from[0] !== to[0]);
    const isPromotion = !!promo;
    const isCastle = pieceType === 'k' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2;

    // Simulate move to test for check / checkmate
    const simulated = new Chess(fen);
    const moveRes = simulated.move({ from, to, promotion: promo });
    const isCheck = simulated.inCheck();
    const isCheckmate = simulated.isCheckmate();

    // Rationale construction
    const tacticalReasons: string[] = [];
    if (isCheckmate) {
      tacticalReasons.push('Delivers unstoppable checkmate');
    } else if (isCheck) {
      tacticalReasons.push('Delivers a forcing check disrupting the enemy king');
    }

    if (isCapture && targetPiece) {
      const capturedName = PIECE_NAMES[targetPiece.type] || 'piece';
      tacticalReasons.push(`Captures the enemy ${capturedName} on ${to}`);
    } else if (isCastle) {
      tacticalReasons.push('Tucks the king into safety while activating the rook');
    } else if (isPromotion) {
      tacticalReasons.push('Promotes the passed pawn to a decisive queen');
    }

    // Positional features
    if (['d4', 'e4', 'd5', 'e5'].includes(to)) {
      tacticalReasons.push('Secures strong control over the vital center squares');
    }
    if (['c4', 'f4', 'c5', 'f5'].includes(to) && pieceType === 'n') {
      tacticalReasons.push('Anchors an advanced outpost for the knight');
    }
    if (['b7', 'g7', 'b2', 'g2'].includes(to) && pieceType === 'r') {
      tacticalReasons.push('Infiltrates the critical 7th rank against enemy pawns');
    }

    if (tacticalReasons.length === 0) {
      tacticalReasons.push('Improves piece harmony, king safety, and coordination');
    }

    const rationale = tacticalReasons.join('. ') + '.';
    const sanStr = moveRes ? moveRes.san : `${from}-${to}`;

    return {
      pieceType,
      pieceName,
      from,
      to,
      isCapture,
      isCheck,
      isPromotion,
      isCastle,
      level1Hint: `Consider moving your ${pieceName} on ${from}.`,
      level2Hint: `Look at the ${to} square with your ${pieceName}.`,
      level3Hint: `${sanStr}: ${rationale}`,
      rationale,
    };
  } catch {
    return defaultExplanation;
  }
}
