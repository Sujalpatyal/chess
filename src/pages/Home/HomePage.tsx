import React, { useEffect, useState } from 'react';
import {
  Swords,
  Users,
  Globe,
  Search,
  Zap,
  Flame,
  Calendar,
  AlertTriangle,
  BookOpen,
  Shield,
  EyeOff,
  Tv,
  Play,
  ArrowRight,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { NavTab } from '../../components/Navigation/Navbar';
import { storageService } from '../../services/StorageService';
import { SavedGame, UnfinishedGameData, UserStatistics } from '../../types/chess';

interface HomePageProps {
  onNavigate: (tab: NavTab) => void;
  onResumeGame?: (data: UnfinishedGameData) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onResumeGame }) => {
  const [stats, setStats] = useState<UserStatistics>(storageService.getStatistics());
  const [recentGames, setRecentGames] = useState<SavedGame[]>([]);
  const [unfinished, setUnfinished] = useState<UnfinishedGameData | null>(null);

  useEffect(() => {
    setStats(storageService.getStatistics());
    setRecentGames(storageService.getSavedGames().slice(0, 5));
    setUnfinished(storageService.getUnfinishedGame());
  }, []);

  const winRate =
    stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  const avgAccuracy =
    stats.ratedAccuracyGames > 0
      ? Math.round(stats.totalAccuracySum / stats.ratedAccuracyGames)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-in fade-in duration-200">
      {/* Resume Unfinished Game Banner */}
      {unfinished && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Resume Unfinished Match</h3>
              <p className="text-xs text-zinc-400">
                You have a saved game vs {unfinished.blackPlayer || 'AI'} ({unfinished.moves.length} moves).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                storageService.clearUnfinishedGame();
                setUnfinished(null);
              }}
              className="px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={() => {
                if (onResumeGame && unfinished) {
                  onResumeGame(unfinished);
                } else {
                  onNavigate(unfinished.gameMode === 'local' ? 'play-local' : 'play-ai');
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/10"
            >
              <Play className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Resume Game</span>
            </button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">
            Games Played
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-mono">
            {stats.gamesPlayed}
          </span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">
            Win Rate
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {winRate}%
          </span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">
            Avg Accuracy
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            {avgAccuracy > 0 ? `${avgAccuracy}%` : '—'}
          </span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 text-center">
          <span className="text-[11px] font-semibold uppercase text-zinc-500 block mb-1">
            Puzzles Solved
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
            {stats.puzzlesSolved}
          </span>
        </div>
      </div>

      {/* Primary Section: PLAY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Play Chess</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('play-ai')}
            className="group bg-gradient-to-br from-zinc-900 to-zinc-900/60 hover:to-zinc-800/80 border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Swords className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                Play vs AI
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Challenge Stockfish across 4 authentic skill levels: Beginner, Intermediate, Advanced, and Expert.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Launch Match</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('play-local')}
            className="group bg-gradient-to-br from-zinc-900 to-zinc-900/60 hover:to-zinc-800/80 border border-zinc-800 hover:border-cyan-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
                Local 1v1
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Two-player pass-and-play on the same device with tournament chess clocks and board flipping.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>Start Pass & Play</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('play-online')}
            className="group bg-gradient-to-br from-zinc-900 to-zinc-900/60 hover:to-zinc-800/80 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                Online Multiplayer
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Create a private room code (e.g. A7K29P), invite a friend, and play live with real-time sync. No login required.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Create / Join Room</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Section: ANALYZE & TRAIN */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Analyze & Train</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={() => onNavigate('analyze')}
            className="p-4 bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2 text-amber-400">
              <Search className="w-4 h-4" />
              <h4 className="text-xs font-bold text-zinc-200">Analysis Board</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Explore variations, evaluate positions with multi-depth Stockfish, and inspect PV lines.
            </p>
          </div>

          <div
            onClick={() => onNavigate('puzzles')}
            className="p-4 bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2 text-cyan-400">
              <Zap className="w-4 h-4" />
              <h4 className="text-xs font-bold text-zinc-200">Tactical Puzzles</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Sharpen tactical vision across pins, forks, skewers, back-rank patterns, and checkmate nets.
            </p>
          </div>

          <div
            onClick={() => onNavigate('puzzle-rush')}
            className="p-4 bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2 text-rose-400">
              <Flame className="w-4 h-4" />
              <h4 className="text-xs font-bold text-zinc-200">Puzzle Rush</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Solve as many puzzles as you can in 3 minutes with 3 lives. Beat your high score!
            </p>
          </div>

          <div
            onClick={() => onNavigate('daily-puzzle')}
            className="p-4 bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2 text-emerald-400">
              <Calendar className="w-4 h-4" />
              <h4 className="text-xs font-bold text-zinc-200">Daily Puzzle</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Solve today’s curated puzzle and build a daily solving streak.
            </p>
          </div>

          <div
            onClick={() => onNavigate('learn-mistakes')}
            className="p-4 bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-xs font-bold text-zinc-200">Learn From Mistakes</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Extract blunders and missed opportunities from your own played games into custom puzzles.
            </p>
          </div>

          <div
            onClick={() => onNavigate('openings')}
            className="p-4 bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2 text-blue-400">
              <BookOpen className="w-4 h-4" />
              <h4 className="text-xs font-bold text-zinc-200">Opening Explorer</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Study ECO opening theory, popular continuations, master win percentages, and variations.
            </p>
          </div>

          <div
            onClick={() => onNavigate('endgames')}
            className="p-4 bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2 text-teal-400">
              <Shield className="w-4 h-4" />
              <h4 className="text-xs font-bold text-zinc-200">Endgame Trainer</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Practice essential endings: KQ vs K, KR vs K, Lucena bridge, Philidor defense, and opposition.
            </p>
          </div>

          <div
            onClick={() => onNavigate('blindfold')}
            className="p-4 bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 mb-2 text-purple-400">
              <EyeOff className="w-4 h-4" />
              <h4 className="text-xs font-bold text-zinc-200">Blindfold Mode</h4>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Train mental visualization by hiding pieces or the entire board while entering moves in algebraic notation.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Games Table */}
      {recentGames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>Recent Games</span>
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/80">
            {recentGames.map((game) => (
              <div
                key={game.id}
                onClick={() => onNavigate('history')}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300">
                    {game.playerColor === 'w' ? 'W' : 'B'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">
                      vs {game.playerColor === 'w' ? game.blackPlayer : game.whitePlayer}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {game.date} • {game.moves.length} moves • {game.opening?.name || 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      game.result === '1-0'
                        ? game.playerColor === 'w'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                        : game.result === '0-1'
                        ? game.playerColor === 'b'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {game.result}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
