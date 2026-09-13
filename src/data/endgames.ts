export interface EndgameScenario {
  id: string;
  title: string;
  category: 'Fundamental' | 'Pawn' | 'Rook' | 'Piece';
  description: string;
  fen: string;
  objective: string;
  goal?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  keyTip: string;
}

export const ENDGAME_SCENARIOS: EndgameScenario[] = [
  {
    id: 'kq-vs-k',
    title: 'King & Queen vs King',
    category: 'Fundamental',
    description: 'Master the boxing-in technique to drive the lone king to the edge of the board.',
    fen: '8/8/8/4k3/8/8/4K3/Q7 w - - 0 1',
    objective: 'Checkmate the lone king within 15 moves without causing a stalemate.',
    goal: 'Checkmate the lone king within 15 moves without causing a stalemate.',
    difficulty: 'Easy',
    keyTip: 'Keep the queen a knight’s move away from the king to shrink its box, then bring your king up to deliver checkmate.',
  },
  {
    id: 'kr-vs-k',
    title: 'King & Rook vs King',
    category: 'Fundamental',
    description: 'The classic building fence technique. Use your king and rook together to push the enemy king to the rank/file edge.',
    fen: '8/8/8/4k3/8/8/4K3/R7 w - - 0 1',
    objective: 'Drive the opposing king to the border rank or file and execute checkmate.',
    goal: 'Drive the opposing king to the border rank or file and execute checkmate.',
    difficulty: 'Medium',
    keyTip: 'Use your rook to cut off ranks and your king to force direct opposition before slicing with the rook.',
  },
  {
    id: 'kp-vs-k-opposition',
    title: 'King & Pawn vs King: Taking the Opposition',
    category: 'Pawn',
    description: 'Learn the critical key squares and opposition principle to escort your pawn to promotion.',
    fen: '8/8/8/4k3/4P3/4K3/8/8 w - - 0 1',
    objective: 'Promote your pawn by securing the key square ahead of it.',
    goal: 'Promote your pawn by securing the key square ahead of it.',
    difficulty: 'Medium',
    keyTip: 'Place your king in front of the pawn, not behind it. Keep the opposition when advancing.',
  },
  {
    id: 'lucena-position',
    title: 'The Lucena Position: Building the Bridge',
    category: 'Rook',
    description: 'The golden formula for winning rook endgames with an advanced passed pawn on the 7th rank.',
    fen: '1K1R4/3P1k2/8/8/8/8/8/2r5 w - - 0 1',
    objective: 'Shield your king from endless checks by building a rook bridge on the 4th rank.',
    goal: 'Shield your king from endless checks by building a rook bridge on the 4th rank.',
    difficulty: 'Hard',
    keyTip: 'Play Rd4! to prepare the bridge, then step your king out to block the opponent’s checks.',
  },
  {
    id: 'philidor-position',
    title: 'The Philidor Position: The Third-Rank Defense',
    category: 'Rook',
    description: 'The fundamental defensive blueprint to hold a draw when defending a rook endgame a pawn down.',
    fen: '4k3/8/8/4r3/3K4/8/4P3/5R2 b - - 0 1',
    objective: 'Hold the draw by preventing the white king from infiltrating.',
    goal: 'Hold the draw by preventing the white king from infiltrating.',
    difficulty: 'Hard',
    keyTip: 'Keep your rook on the 6th rank (or 3rd rank) until the pawn advances, then immediately swing to the back rank for checks.',
  },
];

export const ENDGAMES_DATABASE = ENDGAME_SCENARIOS;
