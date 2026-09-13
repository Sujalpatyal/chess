import { OpeningMove } from '../types/chess';

export interface Opening {
  id: string;
  name: string;
  eco: string;
  category: string;
  moves: string[]; // SAN array e.g. ['e4', 'e5', 'Nf3']
  movesStr: string;
  fen: string;
  description: string;
  commonContinuations: string[];
  stats: {
    whiteWin: number;
    draw: number;
    blackWin: number;
  };
}

export type OpeningData = Opening;

export const OPENINGS_DATABASE: Opening[] = [
  {
    id: 'italian-game',
    name: 'Italian Game',
    eco: 'C50',
    category: '1. e4 (Open Games)',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
    movesStr: '1. e4 e5 2. Nf3 Nc6 3. Bc4',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    description: 'One of the oldest recorded openings, focusing on rapid piece activity and pressure against the vulnerable f7 square.',
    commonContinuations: ['3... Bc5 (Giuoco Piano)', '3... Nf6 (Two Knights Defense)', '3... Be7 (Hungarian Defense)'],
    stats: { whiteWin: 38, draw: 32, blackWin: 30 },
  },
  {
    id: 'ruy-lopez',
    name: 'Ruy Lopez (Spanish Opening)',
    eco: 'C60',
    category: '1. e4 (Open Games)',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
    movesStr: '1. e4 e5 2. Nf3 Nc6 3. Bb5',
    fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    description: 'A classic, deeply analyzed opening putting immediate indirect pressure on the e5 pawn by attacking its knight defender.',
    commonContinuations: ['3... a6 (Morphy Defense)', '3... Nf6 (Berlin Defense)', '3... d6 (Steinitz Defense)'],
    stats: { whiteWin: 39, draw: 34, blackWin: 27 },
  },
  {
    id: 'sicilian-defense',
    name: 'Sicilian Defense',
    eco: 'B20',
    category: '1. e4 (Semi-Open)',
    moves: ['e4', 'c5'],
    movesStr: '1. e4 c5',
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    description: 'The most popular and aggressive response to 1.e4, fighting for the d4 square while maintaining tactical asymmetry.',
    commonContinuations: ['2. Nf3 d6 (Open Sicilian)', '2. Nf3 Nc6', '2. Nf3 e6', '2. c3 (Alapin Variation)'],
    stats: { whiteWin: 37, draw: 31, blackWin: 32 },
  },
  {
    id: 'sicilian-najdorf',
    name: 'Sicilian Najdorf',
    eco: 'B90',
    category: '1. e4 (Semi-Open)',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
    movesStr: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6',
    fen: 'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6',
    description: 'The sharp tactical weapon of world champions Bobby Fischer and Garry Kasparov, offering intense counter-play.',
    commonContinuations: ['6. Be3 e5 (English Attack)', '6. Bg5 e6', '6. Be2 e5'],
    stats: { whiteWin: 36, draw: 34, blackWin: 30 },
  },
  {
    id: 'queens-gambit',
    name: "Queen's Gambit",
    eco: 'D06',
    category: '1. d4 (Closed Games)',
    moves: ['d4', 'd5', 'c4'],
    movesStr: '1. d4 d5 2. c4',
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2',
    description: 'White offers a wing c-pawn to trade for Black’s central d-pawn, aiming for total center domination.',
    commonContinuations: ['2... e6 (Declined)', '2... dxc4 (Accepted)', '2... c6 (Slav Defense)'],
    stats: { whiteWin: 40, draw: 34, blackWin: 26 },
  },
  {
    id: 'queens-gambit-declined',
    name: "Queen's Gambit Declined",
    eco: 'D30',
    category: '1. d4 (Closed Games)',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6'],
    movesStr: '1. d4 d5 2. c4 e6 3. Nc3 Nf6',
    fen: 'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4',
    description: 'Solid and classical, reinforcing d5 and preparing safe, compact kingside castling.',
    commonContinuations: ['4. Bg5 Be7', '4. cxd5 exd5 (Exchange)', '4. Nf3'],
    stats: { whiteWin: 38, draw: 36, blackWin: 26 },
  },
  {
    id: 'french-defense',
    name: 'French Defense',
    eco: 'C00',
    category: '1. e4 (Semi-Open)',
    moves: ['e4', 'e6'],
    movesStr: '1. e4 e6',
    fen: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    description: 'A resilient, counter-attacking system where Black builds a rock-solid pawn chain and counter-attacks on the c-file.',
    commonContinuations: ['2. d4 d5 3. Nc3 (Classical/Winawer)', '2. d4 d5 3. Nd2 (Tarrasch)', '2. d4 d5 3. e5 (Advance)'],
    stats: { whiteWin: 39, draw: 30, blackWin: 31 },
  },
  {
    id: 'caro-kann',
    name: 'Caro-Kann Defense',
    eco: 'B10',
    category: '1. e4 (Semi-Open)',
    moves: ['e4', 'c6'],
    movesStr: '1. e4 c6',
    fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    description: 'Extremely solid and positional for Black, supporting d5 without trapping the light-squared bishop behind pawns.',
    commonContinuations: ['2. d4 d5 3. Nc3 dxe4 (Classical)', '2. d4 d5 3. e5 Bf5 (Advance)', '2. d4 d5 3. exd5 cxd5 (Exchange)'],
    stats: { whiteWin: 38, draw: 33, blackWin: 29 },
  },
  {
    id: 'kings-indian',
    name: "King's Indian Defense",
    eco: 'E60',
    category: '1. d4 (Hypermodern)',
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7'],
    movesStr: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7',
    fen: 'rnbqk2r/ppppppbp/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4',
    description: 'A hypermodern favorite where Black concedes early center territory to launch a vicious, sacrificial kingside pawn attack.',
    commonContinuations: ['4. e4 d6 5. Nf3 O-O (Classical)', '4. e4 d6 5. f3 (Samisch)'],
    stats: { whiteWin: 39, draw: 31, blackWin: 30 },
  },
  {
    id: 'english-opening',
    name: 'English Opening',
    eco: 'A10',
    category: 'Flank Openings',
    moves: ['c4'],
    movesStr: '1. c4',
    fen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1',
    description: 'A flexible flank opening fighting for the central d5 square without committing the central pawns on turn one.',
    commonContinuations: ['1... e5 (Reversed Sicilian)', '1... c5 (Symmetrical)', '1... Nf6'],
    stats: { whiteWin: 38, draw: 35, blackWin: 27 },
  },
];

export const COMMON_OPENING_MOVES: Record<string, OpeningMove[]> = {
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': [
    { san: 'e4', name: "King's Pawn Opening", eco: 'B00', games: 154000, whiteWins: 38, draws: 32, blackWins: 30 },
    { san: 'd4', name: "Queen's Pawn Opening", eco: 'D00', games: 132000, whiteWins: 39, draws: 34, blackWins: 27 },
    { san: 'Nf3', name: 'Zukertort Opening', eco: 'A04', games: 42000, whiteWins: 37, draws: 36, blackWins: 27 },
    { san: 'c4', name: 'English Opening', eco: 'A10', games: 35000, whiteWins: 38, draws: 35, blackWins: 27 },
  ],
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1': [
    { san: 'c5', name: 'Sicilian Defense', eco: 'B20', games: 74000, whiteWins: 37, draws: 31, blackWins: 32 },
    { san: 'e5', name: 'Open Game', eco: 'C20', games: 51000, whiteWins: 39, draws: 31, blackWins: 30 },
    { san: 'e6', name: 'French Defense', eco: 'C00', games: 22000, whiteWins: 39, draws: 30, blackWins: 31 },
    { san: 'c6', name: 'Caro-Kann Defense', eco: 'B10', games: 18000, whiteWins: 38, draws: 33, blackWins: 29 },
  ],
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2': [
    { san: 'Nf3', name: "King's Knight Opening", eco: 'C40', games: 46000, whiteWins: 40, draws: 31, blackWins: 29 },
    { san: 'Nc3', name: 'Vienna Game', eco: 'C25', games: 4200, whiteWins: 37, draws: 29, blackWins: 34 },
    { san: 'Bc4', name: "Bishop's Opening", eco: 'C23', games: 3800, whiteWins: 38, draws: 28, blackWins: 34 },
  ],
};

export function identifyOpening(moves: string[]): { name: string; eco: string } | null {
  if (!moves || moves.length === 0) return null;
  const movesStr = moves.slice(0, 10).join(' ');

  for (const op of OPENINGS_DATABASE) {
    const rawOpMoves = op.moves.join(' ');
    if (movesStr.startsWith(rawOpMoves)) {
      return { name: op.name, eco: op.eco };
    }
  }

  // Fallback broad detections
  if (moves[0] === 'e4' && moves[1] === 'c5') return { name: 'Sicilian Defense', eco: 'B20' };
  if (moves[0] === 'e4' && moves[1] === 'e5' && moves[2] === 'Nf3') return { name: "King's Knight Opening", eco: 'C40' };
  if (moves[0] === 'd4' && moves[1] === 'd5' && moves[2] === 'c4') return { name: "Queen's Gambit", eco: 'D06' };
  if (moves[0] === 'e4' && moves[1] === 'e6') return { name: 'French Defense', eco: 'C00' };
  if (moves[0] === 'e4' && moves[1] === 'c6') return { name: 'Caro-Kann Defense', eco: 'B10' };
  if (moves[0] === 'c4') return { name: 'English Opening', eco: 'A10' };
  if (moves[0] === 'd4' && moves[1] === 'Nf6') return { name: 'Indian Defense', eco: 'A45' };

  return null;
}
