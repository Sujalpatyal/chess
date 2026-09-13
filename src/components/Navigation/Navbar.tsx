import React, { useState } from 'react';
import {
  Crown,
  Swords,
  Search,
  BookOpen,
  History,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  X,
  Volume2,
  VolumeX,
  User,
  Zap,
} from 'lucide-react';
import { storageService } from '../../services/StorageService';
import { soundManager } from '../../chess/sounds';

export type NavTab =
  | 'home'
  | 'play-ai'
  | 'play-local'
  | 'play-online'
  | 'analyze'
  | 'analyze-fen'
  | 'puzzles'
  | 'puzzle-rush'
  | 'daily-puzzle'
  | 'learn-mistakes'
  | 'openings'
  | 'endgames'
  | 'blindfold'
  | 'ai-vs-ai'
  | 'review'
  | 'history'
  | 'statistics'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [settings, setSettings] = useState(storageService.getSettings());
  const [newName, setNewName] = useState(settings.displayName);

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    storageService.saveSettings({ soundEnabled: next });
    soundManager.setEnabled(next);
    setSettings((prev) => ({ ...prev, soundEnabled: next }));
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      storageService.saveSettings({ displayName: newName.trim() });
      setSettings((prev) => ({ ...prev, displayName: newName.trim() }));
    }
    setEditingName(false);
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Crown className="w-4 h-4" /> },
    { id: 'play-ai', label: 'Play vs AI', icon: <Swords className="w-4 h-4" /> },
    { id: 'analyze', label: 'Analyze', icon: <Search className="w-4 h-4" /> },
    { id: 'puzzles', label: 'Puzzles', icon: <Zap className="w-4 h-4" /> },
    { id: 'openings', label: 'Openings', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'statistics', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Crown className="w-5 h-5 fill-zinc-950" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-wider text-zinc-100 uppercase block leading-none">
              AI Chess Assistant
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">Play. Analyze. Improve.</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              currentTab === item.id ||
              (item.id === 'play-ai' && ['play-ai', 'play-local', 'play-online'].includes(currentTab)) ||
              (item.id === 'analyze' && ['analyze', 'analyze-fen', 'review'].includes(currentTab)) ||
              (item.id === 'puzzles' && ['puzzles', 'puzzle-rush', 'daily-puzzle', 'learn-mistakes'].includes(currentTab)) ||
              (item.id === 'openings' && ['openings', 'endgames', 'blindfold', 'ai-vs-ai'].includes(currentTab));

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Sound toggle & Local Profile (NO Login) */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Local Display Name Pill */}
          <div className="relative">
            <button
              onClick={() => setEditingName(!editingName)}
              title="Change display name"
              className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors text-xs font-medium"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                {settings.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-semibold">{settings.displayName}</span>
            </button>

            {editingName && (
              <form
                onSubmit={handleSaveName}
                className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl z-50 animate-in fade-in"
              >
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Local Player Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={16}
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-100 mb-2 focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingName(false)}
                    className="text-[11px] px-2 py-0.5 rounded text-zinc-400 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-[11px] px-2.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-100 border border-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentTab === item.id
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
