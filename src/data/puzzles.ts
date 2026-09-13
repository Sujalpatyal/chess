import type { Puzzle } from '../types/chess';
export type { Puzzle };

export const PUZZLES_DATA: Puzzle[] = [
  {
    id: 'puz-1',
    title: 'Queen & Knight Back-Rank Mate',
    theme: 'Back-Rank Mate',
    rating: 1100,
    sideToMove: 'w',
    fen: '6k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1',
    moves: ['e2e8'],
    description: 'The enemy king is trapped by its own pawn shield on the back rank.',
  },
  {
    id: 'puz-2',
    title: 'The Smothered Mate Classic',
    theme: 'Smothered Mate',
    rating: 1450,
    sideToMove: 'w',
    fen: '6k1/5Npp/8/8/8/8/5Q2/6K1 w - - 0 1',
    moves: ['f7h6', 'g8h8', 'f2g8'],
    description: 'Force the king into the corner and seal its doom.',
  },
  {
    id: 'puz-3',
    title: 'Royal Knight Fork',
    theme: 'Fork',
    rating: 1250,
    sideToMove: 'w',
    fen: 'r1bqk2r/pppp1ppp/2n5/4N3/1b1Pn3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6',
    moves: ['e5c6'],
    description: 'Attack two high-value pieces simultaneously with the knight.',
  },
  {
    id: 'puz-4',
    title: 'Absolute Pin on the Long Diagonal',
    theme: 'Pin',
    rating: 1350,
    sideToMove: 'w',
    fen: 'r1b1k2r/pp3ppp/2n1pn2/q2p4/1b1P4/1PN1PN2/PB3PPP/R2QKB1R w KQkq - 3 9',
    moves: ['a1c1'],
    description: 'Exploit or defend the pinned piece pinned to the king or queen.',
  },
  {
    id: 'puz-5',
    title: 'Deadly Skewer on the Open File',
    theme: 'Skewer',
    rating: 1300,
    sideToMove: 'w',
    fen: '4k3/8/8/8/8/8/4R3/4K1q1 w - - 0 1',
    moves: ['e2e1'],
    description: 'Attack a valuable piece in front, forcing it to move and revealing the target behind.',
  },
  {
    id: 'puz-6',
    title: 'Anastasia’s Mate Net',
    theme: 'Mating Attack',
    rating: 1600,
    sideToMove: 'w',
    fen: '5rk1/1p3Npp/8/8/8/8/1R3PPP/6K1 w - - 0 1',
    moves: ['f7h6'],
    description: 'A knight and rook collaborate to deliver a textbook mating pattern.',
  },
  {
    id: 'puz-7',
    title: 'Tactical Overload on f7',
    theme: 'Deflection',
    rating: 1400,
    sideToMove: 'w',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1P1n1/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    moves: ['c4f7'],
    description: 'Deflect the defender and shatter the enemy king’s shelter.',
  },
  {
    id: 'puz-8',
    title: 'Queen Trap on the Flank',
    theme: 'Trapped Piece',
    rating: 1550,
    sideToMove: 'w',
    fen: 'rn2kbnr/pp3ppp/4p3/2ppP3/3P4/2N1B3/PqP1NPPP/R2QK2R w KQkq - 0 9',
    moves: ['a1b1', 'b2a3', 'b1b3'],
    description: 'Lure the adventurous enemy queen into an inescapable cage.',
  },
  {
    id: 'puz-9',
    title: 'Boden’s Criss-Cross Mate',
    theme: 'Checkmate',
    rating: 1700,
    sideToMove: 'w',
    fen: '2kr4/ppp2ppp/8/8/1B6/8/PPP2PPP/1K1R4 w - - 0 1',
    moves: ['d1d8', 'c8d8', 'b4e7'],
    description: 'Two intersecting bishop diagonals execute a lethal cross-fire.',
  },
  {
    id: 'puz-10',
    title: 'Discovered Check with Material Gain',
    theme: 'Discovered Attack',
    rating: 1380,
    sideToMove: 'w',
    fen: 'r1bqk2r/pppp1ppp/8/4n3/1b2P3/2N1B3/PPP1BPPP/R2QK2R w KQkq - 0 8',
    moves: ['e3d4'],
    description: 'Moving a piece unmasks a devastating line of fire from behind.',
  },
];

/**
 * Returns today's deterministic daily puzzle based on date
 */
export function getDailyPuzzle(dateStr?: string): Puzzle {
  const date = dateStr ? new Date(dateStr) : new Date();
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const index = Math.abs(seed) % PUZZLES_DATA.length;
  return PUZZLES_DATA[index];
}

export const PUZZLE_DATABASE = PUZZLES_DATA;
