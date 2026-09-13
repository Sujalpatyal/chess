import React, { useState, useRef } from 'react';
import { Chess, Square as ChessSquare, Move } from 'chess.js';
import { ChessPiece } from './ChessPieces';
import { BoardThemeId, PieceStyleId, PieceColor } from '../../types/chess';
import { soundManager } from '../../chess/sounds';

export interface BoardArrow {
  from: string;
  to: string;
  color?: string; // e.g. '#10B981' for engine best move, '#EF4444' for threat
}

interface ChessBoardProps {
  chess: Chess;
  orientation?: PieceColor;
  theme?: BoardThemeId;
  pieceStyle?: PieceStyleId;
  showCoordinates?: boolean;
  showLegalMoves?: boolean;
  showLastMoveHighlight?: boolean;
  arrows?: BoardArrow[];
  hintSquare?: string;
  disabled?: boolean;
  onMove?: (move: { from: string; to: string; promotion?: string }) => void;
  lastMove?: { from: string; to: string } | null;
}

const THEME_COLORS: Record<BoardThemeId, { light: string; dark: string }> = {
  classic: { light: 'bg-[#eeeed2]', dark: 'bg-[#769656]' },
  green: { light: 'bg-[#eeeed2]', dark: 'bg-[#769656]' },
  blue: { light: 'bg-[#dee3e6]', dark: 'bg-[#8ca2ad]' },
  dark: { light: 'bg-[#94a3b8]', dark: 'bg-[#334155]' },
  wood: { light: 'bg-[#f0d9b5]', dark: 'bg-[#b58863]' },
  light: { light: 'bg-[#f8fafc]', dark: 'bg-[#cbd5e1]' },
  forest: { light: 'bg-[#e8edde]', dark: 'bg-[#507548]' },
  coral: { light: 'bg-[#f0e8dd]', dark: 'bg-[#d08b68]' },
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  orientation = 'w',
  theme = 'green',
  pieceStyle = 'classic',
  showCoordinates = true,
  showLegalMoves = true,
  showLastMoveHighlight = true,
  arrows = [],
  hintSquare,
  disabled = false,
  onMove,
  lastMove,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const files = orientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  const ranks = orientation === 'w' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];

  const themeClasses = THEME_COLORS[theme] || THEME_COLORS.green;

  // Determine in-check king square
  let inCheckKingSquare: string | null = null;
  if (chess.inCheck()) {
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          inCheckKingSquare = piece.square;
        }
      }
    }
  }

  const handleSquareClick = (sq: string) => {
    if (disabled || pendingPromotion) return;

    // If clicking on already selected square, deselect
    if (selectedSquare === sq) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // If square was previously selected, check if this is a legal move
    if (selectedSquare) {
      const isLegal = legalMoves.some((m) => m.to === sq);
      if (isLegal) {
        attemptMove(selectedSquare, sq);
        return;
      }
    }

    // Otherwise, select piece if it's the current player's piece
    const piece = chess.get(sq as ChessSquare);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(sq);
      const moves = chess.moves({ square: sq as ChessSquare, verbose: true });
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const attemptMove = (from: string, to: string) => {
    const piece = chess.get(from as ChessSquare);
    if (!piece) return;

    // Check for pawn promotion (reaching 8th rank for White or 1st rank for Black)
    const isPromotion =
      piece.type === 'p' &&
      ((piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1')));

    if (isPromotion) {
      setPendingPromotion({ from, to });
      return;
    }

    executeMove(from, to);
  };

  const executeMove = (from: string, to: string, promotion?: string) => {
    if (onMove) {
      onMove({ from, to, promotion });
    }
    setSelectedSquare(null);
    setLegalMoves([]);
    setPendingPromotion(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, sq: string) => {
    if (disabled || pendingPromotion) {
      e.preventDefault();
      return;
    }
    const piece = chess.get(sq as ChessSquare);
    if (!piece || piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setSelectedSquare(sq);
    const moves = chess.moves({ square: sq as ChessSquare, verbose: true });
    setLegalMoves(moves);
    e.dataTransfer.setData('text/plain', sq);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, sq: string) => {
    e.preventDefault();
    const from = e.dataTransfer.getData('text/plain');
    if (from && from !== sq) {
      const isLegal = legalMoves.some((m) => m.to === sq);
      if (isLegal) {
        attemptMove(from, sq);
      }
    }
  };

  // Coordinates helper for SVG arrow points
  const getSquareCenterPct = (sq: string) => {
    const file = sq[0];
    const rank = sq[1];
    const fileIdx = files.indexOf(file);
    const rankIdx = ranks.indexOf(rank);
    if (fileIdx === -1 || rankIdx === -1) return { x: 0, y: 0 };
    return {
      x: (fileIdx + 0.5) * 12.5,
      y: (rankIdx + 0.5) * 12.5,
    };
  };

  return (
    <div className="relative select-none w-full max-w-[560px] aspect-square mx-auto shadow-2xl rounded-lg overflow-hidden border border-zinc-700/50 bg-zinc-900" id="chessboard-container">
      {/* 8x8 Grid */}
      <div ref={boardRef} className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map((rank, rIdx) =>
          files.map((file, fIdx) => {
            const square = `${file}${rank}`;
            const isLight = (rIdx + fIdx) % 2 === 0;
            const piece = chess.get(square as ChessSquare);
            const isSelected = selectedSquare === square;
            const isLegalTarget = legalMoves.some((m) => m.to === square);
            const isCaptureTarget = isLegalTarget && !!piece;
            const isLastMoveFrom = showLastMoveHighlight && lastMove?.from === square;
            const isLastMoveTo = showLastMoveHighlight && lastMove?.to === square;
            const isKingInCheck = inCheckKingSquare === square;
            const isHint = hintSquare === square;

            return (
              <div
                key={square}
                id={`square-${square}`}
                onClick={() => handleSquareClick(square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                  isLight ? themeClasses.light : themeClasses.dark
                } ${isSelected ? 'ring-4 ring-inset ring-amber-400/90 !bg-amber-300/40' : ''} ${
                  isLastMoveFrom || isLastMoveTo ? '!bg-amber-500/25 ring-2 ring-inset ring-amber-400/40' : ''
                } ${isKingInCheck ? '!bg-rose-600/60 ring-4 ring-rose-500 animate-pulse' : ''} ${
                  isHint ? 'ring-4 ring-inset ring-emerald-400 bg-emerald-400/30' : ''
                }`}
              >
                {/* Square coordinate text */}
                {showCoordinates && fIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-semibold pointer-events-none opacity-80 ${
                      isLight ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {showCoordinates && rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-semibold pointer-events-none opacity-80 ${
                      isLight ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Piece Image */}
                {piece && (
                  <div
                    draggable={!disabled && piece.color === chess.turn()}
                    onDragStart={(e) => handleDragStart(e, square)}
                    className="w-full h-full p-1 sm:p-1.5 transition-transform duration-75 active:scale-95 cursor-grab active:cursor-grabbing"
                  >
                    <ChessPiece type={piece.type} color={piece.color} style={pieceStyle} />
                  </div>
                )}

                {/* Legal Move Indicators */}
                {showLegalMoves && isLegalTarget && !isCaptureTarget && (
                  <div className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-zinc-900/35 rounded-full pointer-events-none" />
                )}
                {showLegalMoves && isCaptureTarget && (
                  <div className="absolute inset-0 rounded-full border-4 border-zinc-900/35 pointer-events-none" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Arrow Overlay */}
      {arrows.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100">
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#10B981" fillOpacity="0.85" />
            </marker>
            <marker id="arrowhead-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#EF4444" fillOpacity="0.85" />
            </marker>
          </defs>
          {arrows.map((arr, i) => {
            const start = getSquareCenterPct(arr.from);
            const end = getSquareCenterPct(arr.to);
            const isRed = arr.color?.includes('EF4444');
            return (
              <line
                key={i}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={arr.color || '#10B981'}
                strokeWidth="2.5"
                strokeOpacity="0.85"
                strokeLinecap="round"
                markerEnd={isRed ? 'url(#arrowhead-red)' : 'url(#arrowhead)'}
              />
            );
          })}
        </svg>
      )}

      {/* Pawn Promotion Modal Dialog */}
      {pendingPromotion && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl text-center max-w-xs w-full animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-semibold text-zinc-200 mb-3">Choose Promotion Piece</h4>
            <div className="grid grid-cols-4 gap-2">
              {(['q', 'r', 'b', 'n'] as const).map((pr) => (
                <button
                  key={pr}
                  onClick={() => executeMove(pendingPromotion.from, pendingPromotion.to, pr)}
                  className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex flex-col items-center gap-1 transition-colors"
                >
                  <div className="w-10 h-10">
                    <ChessPiece type={pr} color={chess.turn()} />
                  </div>
                  <span className="text-xs font-semibold uppercase text-zinc-300">
                    {pr === 'q' ? 'Queen' : pr === 'r' ? 'Rook' : pr === 'b' ? 'Bishop' : 'Knight'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
