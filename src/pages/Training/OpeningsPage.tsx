import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '../../components/ChessBoard/ChessBoard';
import { OPENINGS_DATABASE, Opening, identifyOpening } from '../../data/openings';
import { storageService } from '../../services/StorageService';
import { soundManager } from '../../chess/sounds';
import { BookOpen, Search, RotateCcw, ChevronRight, BarChart2 } from 'lucide-react';

export const OpeningsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpening, setSelectedOpening] = useState<Opening>(OPENINGS_DATABASE[0]);
  const [chess, setChess] = useState(() => new Chess());
  const [, setRenderTrigger] = useState(0);
  const [currentPly, setCurrentPly] = useState(0);

  const settings = storageService.getSettings();

  useEffect(() => {
    loadOpening(selectedOpening);
  }, [selectedOpening]);

  const loadOpening = (op: Opening) => {
    const c = new Chess();
    for (const m of op.moves) {
      c.move(m);
    }
    setChess(c);
    setCurrentPly(op.moves.length);
    setRenderTrigger((r) => r + 1);
  };

  const handleStep = (targetPly: number) => {
    const c = new Chess();
    const clamped = Math.max(0, Math.min(selectedOpening.moves.length, targetPly));
    for (let i = 0; i < clamped; i++) {
      c.move(selectedOpening.moves[i]);
    }
    setChess(c);
    setCurrentPly(clamped);
    soundManager.playMove();
    setRenderTrigger((r) => r + 1);
  };

  const filteredOpenings = OPENINGS_DATABASE.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.eco.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Opening Explorer</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Study ECO opening repertoire, master statistics, and strategic plans.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Ruy Lopez, C65, Sicilian..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        {/* Chessboard & Move Stepper */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[500px]">
          <ChessBoard
            chess={chess}
            orientation="w"
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            disabled={true}
          />

          <div className="w-full flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 select-none">
            <button
              onClick={() => handleStep(0)}
              disabled={currentPly === 0}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-xs font-semibold text-zinc-300"
            >
              Start
            </button>
            <button
              onClick={() => handleStep(currentPly - 1)}
              disabled={currentPly === 0}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-xs font-semibold text-zinc-300"
            >
              Prev
            </button>

            <span className="text-xs font-mono font-bold text-amber-300">
              Ply {currentPly} of {selectedOpening.moves.length}
            </span>

            <button
              onClick={() => handleStep(currentPly + 1)}
              disabled={currentPly >= selectedOpening.moves.length}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-xs font-semibold text-zinc-300"
            >
              Next
            </button>
            <button
              onClick={() => handleStep(selectedOpening.moves.length)}
              disabled={currentPly >= selectedOpening.moves.length}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-xs font-semibold text-zinc-300"
            >
              End
            </button>
          </div>
        </div>

        {/* Opening Details & Master List */}
        <div className="w-full lg:w-96 space-y-4">
          {/* Active Opening Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <span className="text-sm font-bold text-zinc-100 block">{selectedOpening.name}</span>
                <span className="text-[11px] text-zinc-400 font-medium">{selectedOpening.category}</span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ECO {selectedOpening.eco}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">{selectedOpening.description}</p>

            {/* Master Win Percentage Bar */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                <span>Master Statistics</span>
                <span className="font-mono">
                  W: {selectedOpening.stats.whiteWin}% • D: {selectedOpening.stats.draw}% • B: {selectedOpening.stats.blackWin}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden flex bg-zinc-950 border border-zinc-800">
                <div style={{ width: `${selectedOpening.stats.whiteWin}%` }} className="bg-zinc-200" title="White Win" />
                <div style={{ width: `${selectedOpening.stats.draw}%` }} className="bg-zinc-500" title="Draw" />
                <div style={{ width: `${selectedOpening.stats.blackWin}%` }} className="bg-zinc-800" title="Black Win" />
              </div>
            </div>
          </div>

          {/* Openings Browser */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Available Openings ({filteredOpenings.length})</span>
            </h3>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredOpenings.map((op) => (
                <div
                  key={op.id}
                  onClick={() => setSelectedOpening(op)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors text-xs ${
                    selectedOpening.id === op.id
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/80 text-zinc-300'
                  }`}
                >
                  <div>
                    <span className="font-bold block">{op.name}</span>
                    <span className="text-[10px] text-zinc-500">{op.moves.slice(0, 4).join(' ')}</span>
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {op.eco}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
