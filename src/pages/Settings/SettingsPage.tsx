import React, { useState } from 'react';
import { storageService } from '../../services/StorageService';
import { soundManager } from '../../chess/sounds';
import { AppSettings, BoardTheme, PieceStyle } from '../../types/chess';
import {
  Settings as SettingsIcon,
  Palette,
  Volume2,
  Sliders,
  RotateCcw,
  Check,
  User,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    storageService.saveSettings({ [key]: value });

    if (key === 'soundEnabled') {
      soundManager.setEnabled(value as boolean);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const handleClearData = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all game history, training progress, and statistics? This cannot be undone.'
      )
    ) {
      storageService.clearAllData();
      setSettings(storageService.getSettings());
      alert('All local applet data has been reset.');
    }
  };

  const boardThemes: { id: BoardTheme; name: string; light: string; dark: string }[] = [
    { id: 'classic', name: 'Classic Green', light: '#EEEED2', dark: '#769656' },
    { id: 'wood', name: 'Wood Grain', light: '#F0D9B5', dark: '#B58863' },
    { id: 'dark', name: 'Dark Slate', light: '#94A3B8', dark: '#334155' },
    { id: 'blue', name: 'Ocean Blue', light: '#DEE3E6', dark: '#8CA2AD' },
    { id: 'forest', name: 'Forest Mint', light: '#E8EDDE', dark: '#507548' },
    { id: 'coral', name: 'Warm Coral', light: '#F0E8DD', dark: '#D08B68' },
  ];

  const pieceStyles: { id: PieceStyle; name: string; desc: string }[] = [
    { id: 'standard', name: 'Standard (cburnett)', desc: 'Clean vector tournament pieces' },
    { id: 'neo', name: 'Neo Modern', desc: 'Sleek high-contrast modern silhouettes' },
    { id: 'vintage', name: 'Vintage Wood', desc: 'Classic wooden aesthetic styling' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            <span>Application Settings</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Customize visual themes, engine parameters, audio, and game preferences.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
          </div>
        )}
      </div>

      {/* Board Theme Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-400" />
          <span>Board Theme Palette</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {boardThemes.map((t) => (
            <button
              key={t.id}
              onClick={() => updateSetting('boardTheme', t.id)}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                settings.boardTheme === t.id
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/30'
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              {/* Mini 2x2 board swatch */}
              <div className="w-9 h-9 rounded-md overflow-hidden grid grid-cols-2 grid-rows-2 shrink-0 border border-zinc-700">
                <div style={{ backgroundColor: t.light }} />
                <div style={{ backgroundColor: t.dark }} />
                <div style={{ backgroundColor: t.dark }} />
                <div style={{ backgroundColor: t.light }} />
              </div>
              <div>
                <span className="text-xs font-bold block">{t.name}</span>
                <span className="text-[10px] text-zinc-500">
                  {settings.boardTheme === t.id ? 'Active' : 'Select'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Piece Style Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          <span>Chess Piece Set</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pieceStyles.map((ps) => (
            <button
              key={ps.id}
              onClick={() => updateSetting('pieceStyle', ps.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                settings.pieceStyle === ps.id
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/30'
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <span className="text-xs font-bold block">{ps.name}</span>
              <span className="text-[11px] text-zinc-500 leading-relaxed block mt-0.5">
                {ps.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Board Overlays & Toggles */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Display & Assistance Toggles</span>
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Sound Effects</span>
              <span className="text-[11px] text-zinc-500">Audio playback on moves, captures, and checks</span>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Board Coordinates</span>
              <span className="text-[11px] text-zinc-500">Display ranks 1-8 and files a-h along the board border</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showCoordinates}
              onChange={(e) => updateSetting('showCoordinates', e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Legal Move Markers</span>
              <span className="text-[11px] text-zinc-500">Highlight valid destination squares when selecting a piece</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showLegalMoves}
              onChange={(e) => updateSetting('showLegalMoves', e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-zinc-200 block">Last Move Highlight</span>
              <span className="text-[11px] text-zinc-500">Shade the source and destination squares of the previous move</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showLastMoveHighlight}
              onChange={(e) => updateSetting('showLastMoveHighlight', e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-amber-500"
            />
          </label>
        </div>
      </div>

      {/* Local Profile Identity (NO Login) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" />
          <span>Local Player Identity</span>
        </h3>
        <p className="text-xs text-zinc-400">
          This name appears on your local games and online room lobbies. Stored locally in your browser.
        </p>

        <div className="flex gap-2 max-w-sm">
          <input
            type="text"
            value={settings.displayName}
            onChange={(e) => updateSetting('displayName', e.target.value)}
            maxLength={18}
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Danger Zone: Clear Storage */}
      <div className="bg-zinc-900 border border-rose-950/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Reset Application Data
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Permanently wipe all saved games, puzzle streaks, high scores, and preferences.
            </p>
          </div>
          <button
            onClick={handleClearData}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
