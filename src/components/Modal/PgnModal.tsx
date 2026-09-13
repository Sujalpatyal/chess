import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { X, Copy, Check, Download, Upload, AlertCircle } from 'lucide-react';

interface PgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPgn: string;
  onImportPgn: (pgn: string) => void;
}

export const PgnModal: React.FC<PgnModalProps> = ({
  isOpen,
  onClose,
  currentPgn,
  onImportPgn,
}) => {
  const [pgnText, setPgnText] = useState(currentPgn);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pgnText || currentPgn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pgnText || currentPgn], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess_game_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPgnText(content);
        validateAndImport(content);
      }
    };
    reader.readAsText(file);
  };

  const validateAndImport = (text: string) => {
    setError(null);
    try {
      const chess = new Chess();
      chess.loadPgn(text);
      if (chess.history().length === 0) {
        throw new Error('PGN parsed but contains no moves.');
      }
      onImportPgn(text);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid PGN format. Please verify the move notation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-100">PGN Import & Export</h3>
            <p className="text-xs text-zinc-400">Standard Portable Game Notation</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <textarea
            value={pgnText}
            onChange={(e) => {
              setPgnText(e.target.value);
              setError(null);
            }}
            placeholder="Paste PGN here... e.g. 1. e4 e5 2. Nf3 Nc6"
            className="w-full h-44 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/60 resize-none"
          />

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .pgn</span>
              </button>

              <label className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input type="file" accept=".pgn,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <button
              onClick={() => validateAndImport(pgnText)}
              className="py-1.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors ml-auto"
            >
              Load & Analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
