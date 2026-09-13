import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '../../components/ChessBoard/ChessBoard';
import { ENDGAMES_DATABASE, EndgameScenario } from '../../data/endgames';
import { stockfishEngine } from '../../engine/StockfishEngine';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { PieceColor } from '../../types/chess';
import { Shield, RotateCcw, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export const EndgamesPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<EndgameScenario>(ENDGAMES_DATABASE[0]);
  const [chess, setChess] = useState(() => new Chess(selectedScenario.fen));
  const [, setRenderTrigger] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [status, setStatus] = useState<'playing' | 'completed' | 'failed'>('playing');

  const settings = storageService.getSettings();
  const orientation = (selectedScenario.fen.split(' ')[1] === 'w' ? 'w' : 'b') as PieceColor;

  useEffect(() => {
    stockfishEngine.initialize();
  }, []);

  const loadScenario = useCallback((scenario: EndgameScenario) => {
    setChess(new Chess(scenario.fen));
    setStatus('playing');
    setIsAiThinking(false);
    setRenderTrigger((r) => r + 1);
  }, []);

  useEffect(() => {
    loadScenario(selectedScenario);
  }, [selectedScenario, loadScenario]);

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (isAiThinking || status === 'completed') return;

    try {
      const res = chess.move(move);
      if (!res) return;
      setRenderTrigger((r) => r + 1);

      if (chess.isCheckmate()) {
        soundManager.playGameOver();
        setStatus('completed');
        return;
      } else if (chess.isDraw()) {
        if (selectedScenario.goal.toLowerCase().includes('draw')) {
          soundManager.playGameOver();
          setStatus('completed');
        } else {
          setStatus('failed');
        }
        return;
      } else {
        soundManager.playMove();
      }

      // Trigger defending AI move
      setIsAiThinking(true);
      stockfishEngine.getBestMove(chess.fen(), 10, 600).then((bestMove) => {
        setIsAiThinking(false);
        if (!bestMove || bestMove === '0000') return;

        chess.move({
          from: bestMove.slice(0, 2),
          to: bestMove.slice(2, 4),
          promotion: bestMove[4] || undefined,
        });
        setRenderTrigger((r) => r + 1);

        if (chess.isCheckmate()) {
          soundManager.playGameOver();
          setStatus('failed');
        } else if (chess.isDraw()) {
          if (selectedScenario.goal.toLowerCase().includes('draw')) {
            setStatus('completed');
          } else {
            setStatus('failed');
          }
        } else {
          soundManager.playMove();
        }
      });
    } catch {
      soundManager.playError();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            <span>Endgame Trainer</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Master critical technical endgames against defensive Stockfish play.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        <div className="flex flex-col items-center gap-3 w-full max-w-[500px]">
          <ChessBoard
            chess={chess}
            orientation={orientation}
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            onMove={handleMove}
            disabled={isAiThinking || status === 'completed'}
          />

          <button
            onClick={() => loadScenario(selectedScenario)}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Position</span>
          </button>
        </div>

        <div className="w-full lg:w-96 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-zinc-100">{selectedScenario.title}</h3>
              <span className="text-[11px] font-mono text-teal-400 font-semibold">
                {selectedScenario.category}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-800/50 text-xs text-teal-200">
              <span className="font-bold block text-teal-400">Goal:</span>
              <span>{selectedScenario.goal}</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">{selectedScenario.description}</p>

            {status === 'completed' && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center gap-2.5 text-emerald-300 text-xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block">Objective Achieved!</span>
                  <span className="text-[11px] text-emerald-400/80">You mastered this endgame position.</span>
                </div>
              </div>
            )}

            {status === 'failed' && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-2.5 text-rose-300 text-xs animate-in fade-in">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <span className="font-bold block">Scenario Failed.</span>
                  <span className="text-[11px] text-rose-400/80">Click reset to try another technique.</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Select Endgame Module
            </h4>
            <div className="space-y-1.5">
              {ENDGAMES_DATABASE.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                    selectedScenario.id === sc.id
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                      : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <span className="font-bold">{sc.title}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
