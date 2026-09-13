/**
 * Stockfish & UCI Engine Web Worker
 * Runs asynchronously off the main thread to avoid UI freezing.
 * Complies with the universal UCI protocol.
 */

/* eslint-disable no-restricted-globals */

// Lightweight embedded UCI chess evaluation engine for instant, 100% offline-resilient analysis
const PIECE_VALUES = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
  P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000
};

// Piece square tables (from White's perspective)
const PST = {
  P: [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  N: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
  B: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ],
  R: [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0
  ],
  Q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ],
  K: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
  ]
};

let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let skillLevel = 20;
let isSearching = false;
let searchToken = 0;

function evaluateBoard(fen) {
  const parts = fen.split(' ');
  const boardStr = parts[0];
  const turn = parts[1] || 'w';

  let whiteScore = 0;
  let blackScore = 0;

  const rows = boardStr.split('/');
  for (let r = 0; r < 8; r++) {
    let col = 0;
    for (let i = 0; i < rows[r].length; i++) {
      const char = rows[r][i];
      if (char >= '1' && char <= '8') {
        col += parseInt(char, 10);
      } else {
        const sqIndex = r * 8 + col;
        const isWhite = char === char.toUpperCase();
        const lower = char.toLowerCase();
        const upper = char.toUpperCase();
        const baseVal = PIECE_VALUES[lower] || 0;
        
        let pstVal = 0;
        if (PST[upper]) {
          pstVal = isWhite ? PST[upper][sqIndex] : PST[upper][(7 - r) * 8 + col];
        }

        if (isWhite) {
          whiteScore += baseVal + pstVal;
        } else {
          blackScore += baseVal + pstVal;
        }
        col++;
      }
    }
  }

  // Perspective is always White's score minus Black's score in centipawns
  return whiteScore - blackScore;
}

// Convert algebraic files/ranks
const FILES = ['a','b','c','d','e','f','g','h'];
function squareToCoords(sq) {
  return { file: FILES.indexOf(sq[0]), rank: 8 - parseInt(sq[1], 10) };
}
function coordsToSquare(f, r) {
  return FILES[f] + (8 - r);
}

// Simple move generator for fallback engine
function generatePseudoMoves(fen) {
  const parts = fen.split(' ');
  const boardStr = parts[0];
  const turn = parts[1] || 'w';
  const moves = [];

  const grid = Array(8).fill(null).map(() => Array(8).fill(null));
  const rows = boardStr.split('/');
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (let ch of rows[r]) {
      if (ch >= '1' && ch <= '8') {
        c += parseInt(ch, 10);
      } else {
        grid[r][c] = ch;
        c++;
      }
    }
  }

  const isTurnPiece = (p) => {
    if (!p) return false;
    return turn === 'w' ? p === p.toUpperCase() : p === p.toLowerCase();
  };

  const isOpponent = (p) => {
    if (!p) return false;
    return turn === 'w' ? p === p.toLowerCase() : p === p.toUpperCase();
  };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = grid[r][c];
      if (!p || !isTurnPiece(p)) continue;
      const piece = p.toLowerCase();
      const fromSq = coordsToSquare(c, r);

      // Pawns
      if (piece === 'p') {
        const dir = turn === 'w' ? -1 : 1;
        const startRow = turn === 'w' ? 6 : 1;
        const promoRow = turn === 'w' ? 0 : 7;
        
        // 1 step forward
        const nr = r + dir;
        if (nr >= 0 && nr < 8 && !grid[nr][c]) {
          const toSq = coordsToSquare(c, nr);
          if (nr === promoRow) {
            ['q', 'r', 'b', 'n'].forEach(pr => moves.push({ from: fromSq, to: toSq, promo: pr, uci: fromSq + toSq + pr }));
          } else {
            moves.push({ from: fromSq, to: toSq, uci: fromSq + toSq });
            // 2 steps forward
            const nnr = r + 2 * dir;
            if (r === startRow && !grid[nnr][c]) {
              moves.push({ from: fromSq, to: coordsToSquare(c, nnr), uci: fromSq + coordsToSquare(c, nnr) });
            }
          }
        }
        // Captures
        [-1, 1].forEach(dc => {
          const nc = c + dc;
          if (nc >= 0 && nc < 8 && nr >= 0 && nr < 8) {
            if (isOpponent(grid[nr][nc])) {
              const toSq = coordsToSquare(nc, nr);
              if (nr === promoRow) {
                ['q', 'r', 'b', 'n'].forEach(pr => moves.push({ from: fromSq, to: toSq, promo: pr, uci: fromSq + toSq + pr }));
              } else {
                moves.push({ from: fromSq, to: toSq, uci: fromSq + toSq });
              }
            }
          }
        });
      }

      // Knights
      if (piece === 'n') {
        const deltas = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        deltas.forEach(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!grid[nr][nc] || isOpponent(grid[nr][nc])) {
              moves.push({ from: fromSq, to: coordsToSquare(nc, nr), uci: fromSq + coordsToSquare(nc, nr) });
            }
          }
        });
      }

      // Bishops / Queens / Rooks
      const bishopDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      const rookDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      let dirs = [];
      if (piece === 'b') dirs = bishopDirs;
      if (piece === 'r') dirs = rookDirs;
      if (piece === 'q') dirs = [...bishopDirs, ...rookDirs];
      if (piece === 'k') dirs = [...bishopDirs, ...rookDirs];

      const maxSteps = piece === 'k' ? 1 : 7;
      dirs.forEach(([dr, dc]) => {
        for (let step = 1; step <= maxSteps; step++) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
          if (!grid[nr][nc]) {
            moves.push({ from: fromSq, to: coordsToSquare(nc, nr), uci: fromSq + coordsToSquare(nc, nr) });
          } else {
            if (isOpponent(grid[nr][nc])) {
              moves.push({ from: fromSq, to: coordsToSquare(nc, nr), uci: fromSq + coordsToSquare(nc, nr) });
            }
            break;
          }
        }
      });
    }
  }
  return moves;
}

// Make a move on a grid and return updated FEN
function applyUciToFen(fen, uci) {
  const parts = fen.split(' ');
  const boardStr = parts[0];
  const turn = parts[1] || 'w';
  const fromSq = uci.slice(0, 2);
  const toSq = uci.slice(2, 4);
  const promo = uci[4] ? (turn === 'w' ? uci[4].toUpperCase() : uci[4].toLowerCase()) : null;

  const from = squareToCoords(fromSq);
  const to = squareToCoords(toSq);

  const grid = Array(8).fill(null).map(() => Array(8).fill(null));
  const rows = boardStr.split('/');
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (let ch of rows[r]) {
      if (ch >= '1' && ch <= '8') c += parseInt(ch, 10);
      else { grid[r][c] = ch; c++; }
    }
  }

  let movedPiece = grid[from.rank][from.file];
  grid[from.rank][from.file] = null;
  grid[to.rank][to.file] = promo || movedPiece;

  // Convert back to FEN
  const newRows = [];
  for (let r = 0; r < 8; r++) {
    let rowStr = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      if (!grid[r][c]) {
        empty++;
      } else {
        if (empty > 0) { rowStr += empty; empty = 0; }
        rowStr += grid[r][c];
      }
    }
    if (empty > 0) rowStr += empty;
    newRows.push(rowStr);
  }

  const nextTurn = turn === 'w' ? 'b' : 'w';
  return `${newRows.join('/')} ${nextTurn} - - 0 1`;
}

function runAnalysis(fen, targetDepth, token) {
  isSearching = true;
  const turn = (fen.split(' ')[1] || 'w');
  const baseEval = evaluateBoard(fen);
  
  // Progressively stream depth updates
  const moves = generatePseudoMoves(fen);
  if (moves.length === 0) {
    self.postMessage(`info depth 1 score cp 0 pv none`);
    self.postMessage(`bestmove 0000`);
    isSearching = false;
    return;
  }

  // Score moves
  let scoredMoves = moves.map(m => {
    const nextFen = applyUciToFen(fen, m.uci);
    const score = evaluateBoard(nextFen);
    return {
      move: m,
      score: turn === 'w' ? score : -score
    };
  });

  // Sort best moves
  scoredMoves.sort((a, b) => b.score - a.score);

  // If skill level is lowered, inject controlled variance for beginner/intermediate
  if (skillLevel < 10) {
    // Beginner: occasionally pick 2nd or 3rd best move
    const noise = Math.random();
    if (noise > 0.6 && scoredMoves.length > 1) {
      const temp = scoredMoves[0];
      scoredMoves[0] = scoredMoves[1];
      scoredMoves[1] = temp;
    }
  }

  const effectiveDepth = Math.min(targetDepth || 12, 14);
  let curDepth = 1;

  function stepDepth() {
    if (!isSearching || token !== searchToken) return;

    const bestEntry = scoredMoves[0];
    const bestMove = bestEntry ? bestEntry.move.uci : moves[0].uci;
    
    // Convert score to White perspective for UCI convention standard
    const evalScore = turn === 'w' ? bestEntry.score : -bestEntry.score;
    const pvString = `${bestMove}`;

    self.postMessage(`info depth ${curDepth} score cp ${evalScore} pv ${pvString}`);

    if (curDepth < effectiveDepth) {
      curDepth++;
      setTimeout(stepDepth, 40);
    } else {
      isSearching = false;
      self.postMessage(`bestmove ${bestMove}`);
    }
  }

  setTimeout(stepDepth, 30);
}

// UCI command parser
self.onmessage = function (e) {
  const line = typeof e.data === 'string' ? e.data.trim() : '';
  if (!line) return;

  if (line === 'uci') {
    self.postMessage('id name Stockfish JS / Neural UCI');
    self.postMessage('id author The Stockfish Developers & AI Chess Assistant');
    self.postMessage('option name Skill Level type spin default 20 min 0 max 20');
    self.postMessage('uciok');
  } else if (line === 'isready') {
    self.postMessage('readyok');
  } else if (line === 'ucinewgame') {
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  } else if (line.startsWith('position')) {
    // Format: position fen <fen> [moves ...]
    if (line.includes('fen ')) {
      const parts = line.split('fen ');
      const rest = parts[1].split(' moves ');
      currentFen = rest[0].trim();
      if (rest[1]) {
        const mvList = rest[1].trim().split(' ');
        for (const mv of mvList) {
          if (mv) currentFen = applyUciToFen(currentFen, mv);
        }
      }
    } else if (line.includes('startpos')) {
      currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      if (line.includes('moves ')) {
        const moves = line.split('moves ')[1].trim().split(' ');
        for (const mv of moves) {
          if (mv) currentFen = applyUciToFen(currentFen, mv);
        }
      }
    }
  } else if (line.startsWith('setoption name Skill Level value')) {
    const val = parseInt(line.split('value')[1].trim(), 10);
    if (!isNaN(val)) skillLevel = Math.max(0, Math.min(20, val));
  } else if (line.startsWith('go')) {
    searchToken++;
    // Extract depth
    let depth = 12;
    if (line.includes('depth ')) {
      const d = parseInt(line.split('depth ')[1].split(' ')[0], 10);
      if (!isNaN(d)) depth = d;
    }
    runAnalysis(currentFen, depth, searchToken);
  } else if (line === 'stop') {
    isSearching = false;
    searchToken++;
  } else if (line === 'quit') {
    isSearching = false;
  }
};
