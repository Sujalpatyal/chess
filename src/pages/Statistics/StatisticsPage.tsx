import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/StorageService';
import { UserStatistics, SavedGame } from '../../types/chess';
import { BarChart3, Trophy, Flame, Zap, Award, BookOpen, Target } from 'lucide-react';

export const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<UserStatistics>(storageService.getStatistics());
  const [games, setGames] = useState<SavedGame[]>([]);

  useEffect(() => {
    setStats(storageService.getStatistics());
    setGames(storageService.getSavedGames());
  }, []);

  const winRate =
    stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  const drawRate =
    stats.gamesPlayed > 0 ? Math.round((stats.draws / stats.gamesPlayed) * 100) : 0;
  const lossRate =
    stats.gamesPlayed > 0 ? Math.round((stats.losses / stats.gamesPlayed) * 100) : 0;

  const avgAccuracy =
    stats.ratedAccuracyGames > 0
      ? Math.round(stats.totalAccuracySum / stats.ratedAccuracyGames)
      : 0;

  // Games as White vs Black
  const whiteGames = games.filter((g) => g.playerColor === 'w');
  const blackGames = games.filter((g) => g.playerColor === 'b');
  const whiteWins = whiteGames.filter((g) => g.result === '1-0').length;
  const blackWins = blackGames.filter((g) => g.result === '0-1').length;
  const whiteWinRate = whiteGames.length > 0 ? Math.round((whiteWins / whiteGames.length) * 100) : 0;
  const blackWinRate = blackGames.length > 0 ? Math.round((blackWins / blackGames.length) * 100) : 0;

  // Favorite openings count
  const openingCounts: { [name: string]: number } = {};
  for (const g of games) {
    if (g.opening?.name) {
      openingCounts[g.opening.name] = (openingCounts[g.opening.name] || 0) + 1;
    }
  }
  const topOpenings = Object.entries(openingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="border-b border-zinc-800 pb-3">
        <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          <span>Performance & Career Statistics</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Lifetime metrics compiled locally from your games and training sessions.
        </p>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase text-zinc-500 block">Total Matches</span>
          <span className="text-3xl font-black font-mono text-zinc-100">{stats.gamesPlayed}</span>
          <span className="text-[10px] text-zinc-500 block">
            {stats.wins}W - {stats.losses}L - {stats.draws}D
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase text-zinc-500 block">Win Rate</span>
          <span className="text-3xl font-black font-mono text-emerald-400">{winRate}%</span>
          <span className="text-[10px] text-zinc-500 block">
            {stats.wins} victories
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase text-zinc-500 block">Average Accuracy</span>
          <span className="text-3xl font-black font-mono text-amber-400">
            {avgAccuracy > 0 ? `${avgAccuracy}%` : '—'}
          </span>
          <span className="text-[10px] text-zinc-500 block">
            Across {stats.ratedAccuracyGames} reviewed games
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center space-y-1">
          <span className="text-[11px] font-bold uppercase text-zinc-500 block">Puzzles Solved</span>
          <span className="text-3xl font-black font-mono text-cyan-400">{stats.puzzlesSolved}</span>
          <span className="text-[10px] text-zinc-500 block">
            {stats.puzzlesAttempted} attempted
          </span>
        </div>
      </div>

      {/* Match Distribution & Side Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outcome Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Match Outcome Distribution</span>
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-400">Wins: {stats.wins} ({winRate}%)</span>
              <span className="text-zinc-400">Draws: {stats.draws} ({drawRate}%)</span>
              <span className="text-rose-400">Losses: {stats.losses} ({lossRate}%)</span>
            </div>

            <div className="h-3 rounded-full overflow-hidden flex bg-zinc-950 border border-zinc-800">
              <div style={{ width: `${winRate}%` }} className="bg-emerald-500" title="Wins" />
              <div style={{ width: `${drawRate}%` }} className="bg-zinc-500" title="Draws" />
              <div style={{ width: `${lossRate}%` }} className="bg-rose-500" title="Losses" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase block">As White</span>
              <span className="text-lg font-bold font-mono text-zinc-200">{whiteWinRate}% Win</span>
              <span className="text-[10px] text-zinc-500 block">{whiteGames.length} games</span>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-center">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase block">As Black</span>
              <span className="text-lg font-bold font-mono text-zinc-200">{blackWinRate}% Win</span>
              <span className="text-[10px] text-zinc-500 block">{blackGames.length} games</span>
            </div>
          </div>
        </div>

        {/* Training Records */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Training & Puzzle Milestones</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Puzzle Rush Record</span>
                <span className="text-xl font-bold font-mono text-zinc-100">{stats.puzzleRushHighScore}</span>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">Daily Streak</span>
                <span className="text-xl font-bold font-mono text-amber-400">{stats.dailyStreak} Days</span>
              </div>
            </div>
          </div>

          {/* Top Openings */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <span>Most Played Openings</span>
            </span>

            {topOpenings.length > 0 ? (
              <div className="space-y-1.5">
                {topOpenings.map(([name, count]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/80"
                  >
                    <span className="font-semibold text-zinc-300">{name}</span>
                    <span className="font-mono text-zinc-500">{count} game{count === 1 ? '' : 's'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">No opening history yet. Play games to track your repertoire!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
