import React, { useState } from 'react';
import { Navbar, NavTab } from './components/Navigation/Navbar';
import { HomePage } from './pages/Home/HomePage';
import { PlayVsAiPage } from './pages/Play/PlayVsAiPage';
import { LocalPlayPage } from './pages/Play/LocalPlayPage';
import { OnlinePlayPage } from './pages/Play/OnlinePlayPage';
import { AnalysisPage } from './pages/Analysis/AnalysisPage';
import { FenAnalyzerPage } from './pages/Analysis/FenAnalyzerPage';
import { GameReviewPage } from './pages/GameReview/GameReviewPage';
import { PuzzlesPage } from './pages/Training/PuzzlesPage';
import { PuzzleRushPage } from './pages/Training/PuzzleRushPage';
import { DailyPuzzlePage } from './pages/Training/DailyPuzzlePage';
import { LearnFromMistakesPage } from './pages/Training/LearnFromMistakesPage';
import { OpeningsPage } from './pages/Training/OpeningsPage';
import { EndgamesPage } from './pages/Training/EndgamesPage';
import { BlindfoldPage } from './pages/Training/BlindfoldPage';
import { AiVsAiPage } from './pages/Training/AiVsAiPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { StatisticsPage } from './pages/Statistics/StatisticsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { SavedGame, UnfinishedGameData } from './types/chess';
import {
  Swords,
  Search,
  Zap,
  BookOpen,
  Crown,
  Heart,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedReviewGame, setSelectedReviewGame] = useState<SavedGame | null>(null);
  const [resumedGameData, setResumedGameData] = useState<UnfinishedGameData | null>(null);

  const handleReviewGame = (game: SavedGame) => {
    setSelectedReviewGame(game);
    setCurrentTab('review');
  };

  const handleResumeGame = (data: UnfinishedGameData) => {
    setResumedGameData(data);
    setCurrentTab(data.gameMode === 'local' ? 'play-local' : 'play-ai');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Navigation Bar */}
      <Navbar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={(tab) => setCurrentTab(tab)}
            onResumeGame={handleResumeGame}
          />
        )}

        {currentTab === 'play-ai' && (
          <PlayVsAiPage
            key={resumedGameData?.id || 'new_ai'}
            initialGame={resumedGameData}
            onReviewGame={handleReviewGame}
            onGoHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'play-local' && (
          <LocalPlayPage
            onReviewGame={handleReviewGame}
            onGoHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'play-online' && (
          <OnlinePlayPage
            onReviewGame={handleReviewGame}
            onGoHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'analyze' && <AnalysisPage />}

        {currentTab === 'analyze-fen' && <FenAnalyzerPage />}

        {currentTab === 'review' && (
          <GameReviewPage
            game={selectedReviewGame}
            onGoBack={() => setCurrentTab('history')}
          />
        )}

        {currentTab === 'puzzles' && <PuzzlesPage />}

        {currentTab === 'puzzle-rush' && <PuzzleRushPage />}

        {currentTab === 'daily-puzzle' && <DailyPuzzlePage />}

        {currentTab === 'learn-mistakes' && <LearnFromMistakesPage />}

        {currentTab === 'openings' && <OpeningsPage />}

        {currentTab === 'endgames' && <EndgamesPage />}

        {currentTab === 'blindfold' && <BlindfoldPage />}

        {currentTab === 'ai-vs-ai' && <AiVsAiPage />}

        {currentTab === 'history' && (
          <HistoryPage onReviewGame={handleReviewGame} />
        )}

        {currentTab === 'statistics' && <StatisticsPage />}

        {currentTab === 'settings' && <SettingsPage />}
      </main>

      {/* Persistent Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-zinc-400">
          <button
            onClick={() => setCurrentTab('play-ai')}
            className="hover:text-amber-400 transition-colors"
          >
            Play AI
          </button>
          <span>•</span>
          <button
            onClick={() => setCurrentTab('analyze')}
            className="hover:text-amber-400 transition-colors"
          >
            Analysis Board
          </button>
          <span>•</span>
          <button
            onClick={() => setCurrentTab('puzzles')}
            className="hover:text-amber-400 transition-colors"
          >
            Puzzles
          </button>
          <span>•</span>
          <button
            onClick={() => setCurrentTab('openings')}
            className="hover:text-amber-400 transition-colors"
          >
            Openings
          </button>
          <span>•</span>
          <button
            onClick={() => setCurrentTab('endgames')}
            className="hover:text-amber-400 transition-colors"
          >
            Endgames
          </button>
          <span>•</span>
          <button
            onClick={() => setCurrentTab('blindfold')}
            className="hover:text-amber-400 transition-colors"
          >
            Blindfold
          </button>
          <span>•</span>
          <button
            onClick={() => setCurrentTab('settings')}
            className="hover:text-amber-400 transition-colors"
          >
            Settings
          </button>
        </div>
        <p className="text-[11px] text-zinc-600">
          AI Chess Assistant • Built with Stockfish Engine & Web Worker • No Account Required
        </p>
      </footer>
    </div>
  );
}
