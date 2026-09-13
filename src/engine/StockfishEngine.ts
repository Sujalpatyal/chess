import { EngineAdapter } from './EngineAdapter';
import { EvaluationResult } from '../types/chess';
import { Chess } from 'chess.js';

export class StockfishEngine implements EngineAdapter {
  private worker: Worker | null = null;
  private initialized: boolean = false;
  private readyPromise: Promise<void> | null = null;
  private currentSearchResolve: ((res: EvaluationResult) => void) | null = null;
  private currentBestMoveResolve: ((move: string) => void) | null = null;
  private onUpdateCallback: ((res: EvaluationResult) => void) | null = null;
  private currentFen: string = '';
  private lastEvaluation: EvaluationResult = {
    score: 0,
    isMate: false,
    depth: 1,
    bestMove: '',
    pv: [],
    winProbabilityWhite: 50,
    winProbabilityBlack: 50,
  };

  /**
   * Convert centipawn evaluation to White win probability percentage (0 - 100)
   * Formula derived from statistical win rates at given centipawn advantages
   */
  public static calculateWinProbability(centipawns: number, isMate: boolean, mateIn?: number): { white: number; black: number } {
    if (isMate) {
      if ((mateIn ?? 0) > 0) return { white: 100, black: 0 };
      if ((mateIn ?? 0) < 0) return { white: 0, black: 100 };
      return { white: 50, black: 50 };
    }
    // Sigmoid model based on empirical master game results
    const winProb = 1 / (1 + Math.pow(10, -centipawns / 400));
    const whitePct = Math.min(99.9, Math.max(0.1, Math.round(winProb * 1000) / 10));
    return {
      white: whitePct,
      black: Math.round((100 - whitePct) * 10) / 10,
    };
  }

  public initialize(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise((resolve) => {
      try {
        this.worker = new Worker('/stockfish-worker.js');
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = (err) => {
          console.warn('Stockfish worker error, fallback handling active:', err);
        };

        // Send UCI initiation
        this.worker.postMessage('uci');
        this.worker.postMessage('isready');

        // Setup fallback timeout so it resolves reliably
        const timeout = setTimeout(() => {
          this.initialized = true;
          resolve();
        }, 1200);

        // When worker sends readyok, finish init
        const tempListener = (e: MessageEvent) => {
          if (typeof e.data === 'string' && (e.data.includes('uciok') || e.data.includes('readyok'))) {
            clearTimeout(timeout);
            this.initialized = true;
            resolve();
          }
        };
        this.worker.addEventListener('message', tempListener);
      } catch (err) {
        console.warn('Worker creation failed, running in simulated mode:', err);
        this.initialized = true;
        resolve();
      }
    });

    return this.readyPromise;
  }

  private handleWorkerMessage(e: MessageEvent) {
    const line = typeof e.data === 'string' ? e.data.trim() : '';
    if (!line) return;

    if (line.startsWith('info') && line.includes('score')) {
      const parsed = this.parseInfoLine(line);
      if (parsed) {
        this.lastEvaluation = parsed;
        if (this.onUpdateCallback) {
          this.onUpdateCallback(parsed);
        }
      }
    } else if (line.startsWith('bestmove')) {
      const parts = line.split(' ');
      const bestMove = parts[1] || '';
      if (bestMove && bestMove !== '0000') {
        this.lastEvaluation.bestMove = bestMove;
        this.lastEvaluation.bestMoveSan = this.convertUciToSan(this.currentFen, bestMove);
      }

      if (this.currentBestMoveResolve) {
        const resolve = this.currentBestMoveResolve;
        this.currentBestMoveResolve = null;
        resolve(bestMove);
      }

      if (this.currentSearchResolve) {
        const resolve = this.currentSearchResolve;
        this.currentSearchResolve = null;
        resolve(this.lastEvaluation);
      }
    }
  }

  private parseInfoLine(line: string): EvaluationResult | null {
    try {
      const tokens = line.split(' ');
      let depth = 1;
      let score = 0;
      let isMate = false;
      let mateIn: number | undefined;
      const pv: string[] = [];

      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === 'depth' && tokens[i + 1]) {
          depth = parseInt(tokens[i + 1], 10);
        } else if (tokens[i] === 'score') {
          const type = tokens[i + 1];
          const val = parseInt(tokens[i + 2], 10);
          if (type === 'cp') {
            score = val;
          } else if (type === 'mate') {
            isMate = true;
            mateIn = val;
            score = val > 0 ? 10000 - val * 100 : -10000 - val * 100;
          }
        } else if (tokens[i] === 'pv') {
          for (let j = i + 1; j < tokens.length; j++) {
            if (tokens[j].length >= 4) {
              pv.push(tokens[j]);
            }
          }
          break;
        }
      }

      const bestMove = pv[0] || this.lastEvaluation.bestMove;
      const bestMoveSan = this.convertUciToSan(this.currentFen, bestMove);
      const winProbs = StockfishEngine.calculateWinProbability(score, isMate, mateIn);

      return {
        score,
        isMate,
        mateIn,
        depth,
        bestMove,
        bestMoveSan,
        pv,
        winProbabilityWhite: winProbs.white,
        winProbabilityBlack: winProbs.black,
      };
    } catch {
      return null;
    }
  }

  private convertUciToSan(fen: string, uci: string): string | undefined {
    if (!fen || !uci || uci.length < 4) return undefined;
    try {
      const chess = new Chess(fen);
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci[4] || undefined;
      const move = chess.move({ from, to, promotion });
      return move ? move.san : undefined;
    } catch {
      return undefined;
    }
  }

  public setPosition(fen: string, moves?: string[]): void {
    this.currentFen = fen;
    if (!this.worker) return;
    let cmd = `position fen ${fen}`;
    if (moves && moves.length > 0) {
      cmd += ` moves ${moves.join(' ')}`;
    }
    this.worker.postMessage(cmd);
  }

  public setOption(name: string, value: string | number): void {
    if (!this.worker) return;
    this.worker.postMessage(`setoption name ${name} value ${value}`);
  }

  public stop(): void {
    if (this.worker) {
      this.worker.postMessage('stop');
    }
    if (this.currentSearchResolve) {
      const resolve = this.currentSearchResolve;
      this.currentSearchResolve = null;
      resolve(this.lastEvaluation);
    }
    if (this.currentBestMoveResolve) {
      const resolve = this.currentBestMoveResolve;
      this.currentBestMoveResolve = null;
      resolve(this.lastEvaluation.bestMove || '');
    }
  }

  public analyze(
    fen: string,
    depth: number = 12,
    onUpdate?: (evalResult: EvaluationResult) => void
  ): Promise<EvaluationResult> {
    this.stop();
    this.currentFen = fen;
    this.onUpdateCallback = onUpdate || null;

    return new Promise((resolve) => {
      this.currentSearchResolve = resolve;
      this.setPosition(fen);
      if (this.worker) {
        this.worker.postMessage(`go depth ${depth}`);
      } else {
        // Fallback immediate eval
        const res: EvaluationResult = {
          score: 0,
          isMate: false,
          depth: 1,
          bestMove: '',
          pv: [],
          winProbabilityWhite: 50,
          winProbabilityBlack: 50,
        };
        resolve(res);
      }
    });
  }

  public getBestMove(fen: string, depth: number = 10, moveTimeMs?: number): Promise<string> {
    this.stop();
    this.currentFen = fen;

    return new Promise((resolve) => {
      this.currentBestMoveResolve = resolve;
      this.setPosition(fen);
      if (this.worker) {
        if (moveTimeMs) {
          this.worker.postMessage(`go movetime ${moveTimeMs}`);
        } else {
          this.worker.postMessage(`go depth ${depth}`);
        }
      } else {
        resolve('');
      }
    });
  }

  public setDifficulty(level: 'beginner' | 'intermediate' | 'advanced' | 'expert') {
    switch (level) {
      case 'beginner':
        this.setOption('Skill Level', 2);
        break;
      case 'intermediate':
        this.setOption('Skill Level', 8);
        break;
      case 'advanced':
        this.setOption('Skill Level', 15);
        break;
      case 'expert':
        this.setOption('Skill Level', 20);
        break;
    }
  }

  public quit(): void {
    if (this.worker) {
      this.worker.postMessage('quit');
      this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
    this.readyPromise = null;
  }

  public isReady(): boolean {
    return this.initialized;
  }
}

// Singleton instance for general use
export const stockfishEngine = new StockfishEngine();
