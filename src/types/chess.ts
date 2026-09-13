export type PieceColor = 'w' | 'b';
export type Square = string; // e.g. 'e4'

export enum MoveClassification {
  BRILLIANT = 'brilliant',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  INACCURACY = 'inaccuracy',
  MISTAKE = 'mistake',
  BLUNDER = 'blunder',
  BOOK = 'book',
}

export type MoveClassificationType =
  | 'brilliant'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'book';

export interface MoveAnalysis {
  moveNumber: number;
  color: PieceColor;
  san: string;
  uci: string;
  from: string;
  to: string;
  promotion?: string;
  fenBefore: string;
  fenAfter: string;
  evaluationBefore: number; // centipawns from White's perspective (+100 = +1.0)
  evaluationAfter: number;
  bestMove: string; // uci or san
  bestMoveSan?: string;
  classification: MoveClassificationType;
  centipawnLoss: number;
  principalVariation?: string[];
  explanation?: string;
}

export interface EvaluationResult {
  score: number; // in centipawns (positive for White, negative for Black)
  isMate: boolean;
  mateIn?: number;
  depth: number;
  bestMove: string; // e.g. 'e2e4'
  bestMoveSan?: string;
  pv: string[]; // principal variation
  winProbabilityWhite: number; // 0 to 100
  winProbabilityBlack: number;
  nodes?: number;
  nps?: number;
}

export interface TurningPoint {
  moveIndex: number;
  moveNumber: number;
  color: PieceColor;
  san: string;
  type: 'blunder' | 'swing' | 'missed_tactic' | 'lead_change' | 'turning_point';
  evalBefore: number;
  evalAfter: number;
  description: string;
  recommendedMove: string;
}

export interface GameReviewData {
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteBreakdown: Record<MoveClassificationType, number>;
  blackBreakdown: Record<MoveClassificationType, number>;
  turningPoints: TurningPoint[];
  evalGraph: {
    moveIndex: number;
    san: string;
    eval: number; // White perspective (-10 to +10 range for graphing)
    color: PieceColor;
  }[];
  moves: MoveAnalysis[];
}

export interface SavedGame {
  id: string;
  date: string;
  whitePlayer: string;
  blackPlayer: string;
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
  reason?: string;
  moves: string[]; // array of SAN moves
  pgn: string;
  initialFen: string;
  finalFen: string;
  timeControl: string;
  durationSeconds?: number;
  opening?: {
    name: string;
    eco: string;
  };
  accuracy?: {
    white: number;
    black: number;
  };
  isUnfinished?: boolean;
  gameMode: 'ai' | 'local' | 'online' | 'analysis';
  aiDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  playerColor?: PieceColor;
  analyses?: MoveAnalysis[];
  gameReview?: GameReviewData;
}

export interface UnfinishedGameData {
  id: string;
  gameMode: 'ai' | 'local' | 'online';
  fen: string;
  pgn: string;
  moves: string[];
  whitePlayer: string;
  blackPlayer: string;
  playerColor: PieceColor;
  aiDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timeControl: {
    initialMinutes: number;
    incrementSeconds: number;
  };
  whiteTimeMs: number;
  blackTimeMs: number;
  lastTurnTime: number;
  timestamp: number;
}

export interface Puzzle {
  id: string;
  fen: string;
  moves: string[]; // sequence of moves in UCI or SAN (player moves first)
  rating: number;
  theme: string;
  themes?: string[];
  description: string;
  sideToMove: PieceColor;
  title: string;
}

export interface OpeningMove {
  san: string;
  name?: string;
  eco?: string;
  games: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
}

export interface OpeningData {
  id?: string;
  name: string;
  eco: string;
  moves: string; // e.g. "1. e4 e5 2. Nf3"
  fen: string;
  description: string;
  commonContinuations: string[];
  category?: string;
  stats?: {
    whiteWin: number;
    draw: number;
    blackWin: number;
  };
}

export type BoardThemeId = 'classic' | 'light' | 'dark' | 'green' | 'blue' | 'wood' | 'forest' | 'coral';
export type PieceStyleId = 'standard' | 'classic' | 'modern' | 'minimal' | 'neo' | 'vintage';

export type BoardTheme = BoardThemeId;
export type PieceStyle = PieceStyleId;

export interface UserSettings {
  displayName: string;
  boardTheme: BoardThemeId;
  pieceStyle: PieceStyleId;
  soundEnabled: boolean;
  showCoordinates: boolean;
  showLegalMoves: boolean;
  showLastMoveHighlight: boolean;
  showEngineEvaluation: boolean;
  showBestMoveArrow: boolean;
  showClassificationBadges: boolean;
  animationSpeed: 'fast' | 'normal' | 'slow' | 'none';
}

export type AppSettings = UserSettings;

export interface UserStatistics {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalAccuracySum: number;
  ratedAccuracyGames: number;
  blundersTotal: number;
  mistakesTotal: number;
  puzzleRushBest: number;
  puzzleRushHighScore: number;
  puzzlesAttempted: number;
  puzzlesSolved: number;
  dailyStreak: number;
  lastDailyPuzzleDate: string;
}
