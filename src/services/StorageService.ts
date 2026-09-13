import {
  SavedGame,
  UnfinishedGameData,
  UserSettings,
  UserStatistics,
  GameReviewData,
} from '../types/chess';

const STORAGE_KEYS = {
  SETTINGS: 'ai_chess_settings_v1',
  GAMES: 'ai_chess_saved_games_v1',
  UNFINISHED_GAME: 'ai_chess_unfinished_v1',
  STATISTICS: 'ai_chess_statistics_v1',
  PUZZLE_RUSH_BEST: 'ai_chess_rush_best_v1',
  SOLVED_PUZZLES: 'ai_chess_solved_puzzles_v1',
  CUSTOM_MISTAKE_PUZZLES: 'ai_chess_mistake_puzzles_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  displayName: 'Player',
  boardTheme: 'classic',
  pieceStyle: 'classic',
  soundEnabled: true,
  showCoordinates: true,
  showLegalMoves: true,
  showLastMoveHighlight: true,
  showEngineEvaluation: true,
  showBestMoveArrow: true,
  showClassificationBadges: true,
  animationSpeed: 'normal',
};

export const DEFAULT_STATISTICS: UserStatistics = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  totalAccuracySum: 0,
  ratedAccuracyGames: 0,
  blundersTotal: 0,
  mistakesTotal: 0,
  puzzleRushBest: 0,
  puzzleRushHighScore: 0,
  puzzlesAttempted: 0,
  puzzlesSolved: 0,
  dailyStreak: 0,
  lastDailyPuzzleDate: '',
};

class StorageService {
  // Settings
  public getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: Partial<UserSettings>): UserSettings {
    const updated = { ...this.getSettings(), ...settings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    return updated;
  }

  // Games
  public getSavedGames(): SavedGame[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAMES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getGameById(id: string): SavedGame | undefined {
    return this.getSavedGames().find((g) => g.id === id);
  }

  public saveGame(game: SavedGame): void {
    const games = this.getSavedGames().filter((g) => g.id !== game.id);
    games.unshift(game);
    try {
      localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games.slice(0, 100))); // Keep last 100
      this.updateStatsFromGame(game);
    } catch (err) {
      console.error('Failed to save game:', err);
    }
  }

  public deleteGame(id: string): void {
    const games = this.getSavedGames().filter((g) => g.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
    } catch (err) {
      console.error('Failed to delete game:', err);
    }
  }

  public updateGameAnalysis(id: string, review: GameReviewData): void {
    const games = this.getSavedGames();
    const target = games.find((g) => g.id === id);
    if (target) {
      target.gameReview = review;
      target.analyses = review.moves;
      target.accuracy = {
        white: review.whiteAccuracy,
        black: review.blackAccuracy,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
      } catch (err) {
        console.error('Failed to update game analysis:', err);
      }
    }
  }

  public clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.GAMES);
      localStorage.removeItem(STORAGE_KEYS.UNFINISHED_GAME);
      localStorage.removeItem(STORAGE_KEYS.STATISTICS);
      localStorage.removeItem(STORAGE_KEYS.PUZZLE_RUSH_BEST);
      localStorage.removeItem(STORAGE_KEYS.SOLVED_PUZZLES);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_MISTAKE_PUZZLES);
    } catch (err) {
      console.error('Failed to clear data:', err);
    }
  }

  public recordPuzzleResult(isWin: boolean): void {
    const stats = this.getStatistics();
    stats.puzzlesAttempted += 1;
    if (isWin) {
      stats.puzzlesSolved += 1;
    }
    this.saveStatistics(stats);
  }

  // Unfinished Game Auto-save & Resume
  public getUnfinishedGame(): UnfinishedGameData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UNFINISHED_GAME);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public saveUnfinishedGame(data: UnfinishedGameData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.UNFINISHED_GAME, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save unfinished game:', err);
    }
  }

  public clearUnfinishedGame(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.UNFINISHED_GAME);
    } catch (err) {
      console.error('Failed to clear unfinished game:', err);
    }
  }

  // Statistics
  public getStatistics(): UserStatistics {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATISTICS);
      return data ? { ...DEFAULT_STATISTICS, ...JSON.parse(data) } : DEFAULT_STATISTICS;
    } catch {
      return DEFAULT_STATISTICS;
    }
  }

  public saveStatistics(stats: Partial<UserStatistics>): UserStatistics {
    const updated = { ...this.getStatistics(), ...stats };
    try {
      localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save stats:', err);
    }
    return updated;
  }

  private updateStatsFromGame(game: SavedGame): void {
    const stats = this.getStatistics();
    stats.gamesPlayed += 1;

    const isWhite = game.playerColor === 'w';
    if (game.result === '1-0') {
      if (isWhite) stats.wins += 1;
      else stats.losses += 1;
    } else if (game.result === '0-1') {
      if (!isWhite) stats.wins += 1;
      else stats.losses += 1;
    } else if (game.result === '1/2-1/2') {
      stats.draws += 1;
    }

    if (game.accuracy) {
      const playerAcc = isWhite ? game.accuracy.white : game.accuracy.black;
      if (playerAcc > 0) {
        stats.totalAccuracySum += playerAcc;
        stats.ratedAccuracyGames += 1;
      }
    }

    this.saveStatistics(stats);
  }

  // Puzzle Rush
  public getPuzzleRushBest(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.PUZZLE_RUSH_BEST);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  public savePuzzleRushBest(score: number): void {
    const current = this.getPuzzleRushBest();
    if (score > current) {
      try {
        localStorage.setItem(STORAGE_KEYS.PUZZLE_RUSH_BEST, score.toString());
      } catch (err) {
        console.error('Failed to save puzzle rush best:', err);
      }
    }
  }

  // Solved Puzzles set
  public getSolvedPuzzles(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SOLVED_PUZZLES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public markPuzzleSolved(id: string): void {
    const solved = new Set(this.getSolvedPuzzles());
    solved.add(id);
    try {
      localStorage.setItem(STORAGE_KEYS.SOLVED_PUZZLES, JSON.stringify(Array.from(solved)));
      const stats = this.getStatistics();
      stats.puzzlesSolved = solved.size;
      this.saveStatistics(stats);
    } catch (err) {
      console.error('Failed to record puzzle solved:', err);
    }
  }

  // Custom Mistake Puzzles
  public getMistakePuzzles(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_MISTAKE_PUZZLES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveMistakePuzzles(puzzles: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_MISTAKE_PUZZLES, JSON.stringify(puzzles));
    } catch (err) {
      console.error('Failed to save mistake puzzles:', err);
    }
  }
}

export const storageService = new StorageService();
