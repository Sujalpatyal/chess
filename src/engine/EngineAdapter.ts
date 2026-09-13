import { EvaluationResult } from '../types/chess';

export interface EngineAdapter {
  initialize(): Promise<void>;
  setPosition(fen: string, moves?: string[]): void;
  setOption(name: string, value: string | number): void;
  analyze(
    fen: string,
    depth?: number,
    onUpdate?: (evalResult: EvaluationResult) => void
  ): Promise<EvaluationResult>;
  getBestMove(fen: string, depth?: number, moveTimeMs?: number): Promise<string>;
  stop(): void;
  quit(): void;
  isReady(): boolean;
}
