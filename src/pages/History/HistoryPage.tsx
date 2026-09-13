import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/StorageService';
import { SavedGame } from '../../types/chess';
import {
  History,
  Trash2,
  Download,
  BarChart2,
  Calendar,
  Search,
  Filter,
  FileText,
} from 'lucide-react';

interface HistoryPageProps {
  onReviewGame: (game: SavedGame) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onReviewGame }) => {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss' | 'draw'>('all');

  useEffect(() => {
    setGames(storageService.getSavedGames());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved game record?')) {
      storageService.deleteGame(id);
      setGames(storageService.getSavedGames());
    }
  };

  const handleExportAll = () => {
    const allPgn = games.map((g) => g.pgn).join('\n\n\n');
    const blob = new Blob([allPgn], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_chess_games_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = games.filter((g) => {
    const matchesSearch =
      g.whitePlayer.toLowerCase().includes(search.toLowerCase()) ||
      g.blackPlayer.toLowerCase().includes(search.toLowerCase()) ||
      (g.opening?.name && g.opening.name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterResult === 'win') {
      return (g.playerColor === 'w' && g.result === '1-0') || (g.playerColor === 'b' && g.result === '0-1');
    }
    if (filterResult === 'loss') {
      return (g.playerColor === 'w' && g.result === '0-1') || (g.playerColor === 'b' && g.result === '1-0');
    }
    if (filterResult === 'draw') {
      return g.result === '1/2-1/2';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <span>Game History & Archives</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Browse and review past played matches. Total games: {games.length}
          </p>
        </div>

        {games.length > 0 && (
          <button
            onClick={handleExportAll}
            className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All PGN</span>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by opponent or opening..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          {[
            { id: 'all', label: 'All' },
            { id: 'win', label: 'Wins' },
            { id: 'loss', label: 'Losses' },
            { id: 'draw', label: 'Draws' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterResult(f.id as any)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterResult === f.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game List */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300">No games found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Play a match against Stockfish or locally with a friend to begin building your personal game history.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/80">
          {filtered.map((g) => {
            const isUserWhite = g.playerColor === 'w';
            const isUserWin =
              (isUserWhite && g.result === '1-0') || (!isUserWhite && g.result === '0-1');
            const isUserLoss =
              (isUserWhite && g.result === '0-1') || (!isUserWhite && g.result === '1-0');

            return (
              <div
                key={g.id}
                onClick={() => onReviewGame(g)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-zinc-800/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300">
                    {g.playerColor === 'w' ? 'White' : 'Black'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-100">
                        {g.whitePlayer} vs {g.blackPlayer}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isUserWin
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isUserLoss
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {g.result}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>{g.date}</span>
                      <span>•</span>
                      <span>{g.moves.length} moves</span>
                      <span>•</span>
                      <span>{g.opening?.name || 'Standard Match'}</span>
                      {g.accuracy && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-mono">
                            Acc: {isUserWhite ? g.accuracy.white : g.accuracy.black}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReviewGame(g);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Review Game</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(g.id, e)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
