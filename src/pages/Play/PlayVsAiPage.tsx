import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard, BoardArrow } from '../../components/ChessBoard/ChessBoard';
import { EvaluationBar } from '../../components/EvaluationBar/EvaluationBar';
import { MoveHistory } from '../../components/MoveHistory/MoveHistory';
import { GameClock } from '../../components/GameClock/GameClock';
import { EnginePanel } from '../../components/EnginePanel/EnginePanel';
import { GameOverModal } from '../../components/Modal/GameOverModal';
import { stockfishEngine } from '../../engine/StockfishEngine';
import { soundManager } from '../../chess/sounds';
import { storageService } from '../../services/StorageService';
import { classifyMove } from '../../analysis/moveClassification';
import { explainMove } from '../../analysis/tacticalExplanations';
import { identifyOpening } from '../../data/openings';
import {
  PieceColor,
  EvaluationResult,
  MoveAnalysis,
  UnfinishedGameData,
  SavedGame,
} from '../../types/chess';
import {
  RotateCcw,
  Flag,
  Handshake,
  HelpCircle,
  Eye,
  EyeOff,
  Settings2,
} from 'lucide-react';

interface PlayVsAiPageProps {
  onReviewGame?: (game: SavedGame) => void;
  onGoHome: () => void;
  initialGame?: UnfinishedGameData | null;
}

export const PlayVsAiPage: React.FC<PlayVsAiPageProps> = ({
  onReviewGame,
  onGoHome,
  initialGame,
}) => {
  // Game Configuration State
  const [inSetup, setInSetup] = useState(!initialGame);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>(
    initialGame?.aiDifficulty || 'intermediate'
  );
  const [playerColor, setPlayerColor] = useState<PieceColor>(initialGame?.playerColor || 'w');
  const [timeControl, setTimeControl] = useState<{ initialMinutes: number; incrementSeconds: number }>({
    initialMinutes: initialGame?.timeControl.initialMinutes ?? 10,
    incrementSeconds: initialGame?.timeControl.incrementSeconds ?? 0,
  });

  // Game Engine & State
  const [chess] = useState(() => new Chess(initialGame?.fen || undefined));
  const [, setRenderTrigger] = useState(0); // Trigger re-renders
  const [moves, setMoves] = useState<string[]>(initialGame?.moves || []);
  const [analyses, setAnalyses] = useState<MoveAnalysis[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(
    initialGame?.moves ? initialGame.moves.length - 1 : -1
  );
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Engine Evaluation
  const [evaluation, setEvaluation] = useState<EvaluationResult>({
    score: 0,
    isMate: false,
    depth: 1,
    bestMove: '',
    pv: [],
    winProbabilityWhite: 50,
    winProbabilityBlack: 50,
  });
  const [showEngine, setShowEngine] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [engineDepth, setEngineDepth] = useState(12);

  // Hints
  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState('');
  const [hintSquare, setHintSquare] = useState<string | undefined>(undefined);

  // Clocks
  const [whiteTimeMs, setWhiteTimeMs] = useState(
    initialGame ? initialGame.whiteTimeMs : timeControl.initialMinutes * 60 * 1000
  );
  const [blackTimeMs, setBlackTimeMs] = useState(
    initialGame ? initialGame.blackTimeMs : timeControl.initialMinutes * 60 * 1000
  );
  const [isClockRunning, setIsClockRunning] = useState(false);

  // Game Over Modal
  const [gameOverModal, setGameOverModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    result: '1-0' | '0-1' | '1/2-1/2' | '*';
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    result: '*',
  });

  const settings = storageService.getSettings();
  const isUnlimited = timeControl.initialMinutes === 0;

  // Initialize Stockfish
  useEffect(() => {
    stockfishEngine.initialize().then(() => {
      stockfishEngine.setDifficulty(difficulty);
    });
  }, [difficulty]);

  // Clock countdown interval
  useEffect(() => {
    if (!isClockRunning || isUnlimited || gameOverModal.isOpen || inSetup) return;

    const interval = setInterval(() => {
      const turn = chess.turn();
      if (turn === 'w') {
        setWhiteTimeMs((t) => {
          if (t <= 100) {
            handleTimeout('w');
            return 0;
          }
          return t - 100;
        });
      } else {
        setBlackTimeMs((t) => {
          if (t <= 100) {
            handleTimeout('b');
            return 0;
          }
          return t - 100;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isClockRunning, chess, isUnlimited, gameOverModal.isOpen, inSetup]);

  const handleTimeout = (timedOutColor: PieceColor) => {
    setIsClockRunning(false);
    soundManager.playGameOver();
    const winner = timedOutColor === 'w' ? 'Black' : 'White';
    const res = timedOutColor === 'w' ? '0-1' : '1-0';
    finishGame(res, 'Time Out', `${winner} wins on time.`);
  };

  // Run AI move if it is AI's turn
  const checkAndRunAiMove = useCallback(() => {
    if (chess.isGameOver() || gameOverModal.isOpen || inSetup) return;
    const isAiTurn = chess.turn() !== playerColor;
    if (!isAiTurn) return;

    setIsAiThinking(true);
    let depth = 8;
    let moveTime = 600;

    if (difficulty === 'beginner') { depth = 4; moveTime = 400; }
    else if (difficulty === 'intermediate') { depth = 8; moveTime = 700; }
    else if (difficulty === 'advanced') { depth = 12; moveTime = 1200; }
    else if (difficulty === 'expert') { depth = 16; moveTime = 1800; }

    const fen = chess.fen();
    stockfishEngine.getBestMove(fen, depth, moveTime).then((bestMove) => {
      setIsAiThinking(false);
      if (!bestMove || bestMove === '0000') return;

      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      const promotion = bestMove[4] || undefined;

      try {
        const moveRes = chess.move({ from, to, promotion });
        if (moveRes) {
          handlePostMove(moveRes, from, to);
        }
      } catch (err) {
        console.warn('AI move execution failed:', err);
      }
    });
  }, [chess, playerColor, difficulty, gameOverModal.isOpen, inSetup]);

  // Check AI move on turn change
  useEffect(() => {
    if (!inSetup && !gameOverModal.isOpen) {
      if (chess.turn() !== playerColor) {
        const timer = setTimeout(checkAndRunAiMove, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [chess, playerColor, inSetup, gameOverModal.isOpen, checkAndRunAiMove]);

  // Real-time evaluation calculation
  const updateEngineAnalysis = useCallback((fen: string) => {
    if (!showEngine) return;
    stockfishEngine.analyze(fen, engineDepth, (res) => {
      setEvaluation(res);
    });
  }, [showEngine, engineDepth]);

  // Handle post move actions (sound, clocks, game over check, save)
  const handlePostMove = (
    moveRes: any,
    from: string,
    to: string
  ) => {
    setLastMove({ from, to });
    setMoves([...chess.history()]);
    setCurrentMoveIndex(chess.history().length - 1);
    setRenderTrigger((r) => r + 1);

    // Play sounds
    if (chess.isCheckmate() || chess.isDraw()) {
      soundManager.playGameOver();
    } else if (chess.inCheck()) {
      soundManager.playCheck();
    } else if (moveRes.captured) {
      soundManager.playCapture();
    } else if (moveRes.san.includes('O-O')) {
      soundManager.playCastle();
    } else if (moveRes.promotion) {
      soundManager.playPromote();
    } else {
      soundManager.playMove();
    }

    // Add increment to the player who just moved
    if (!isUnlimited && timeControl.incrementSeconds > 0) {
      if (moveRes.color === 'w') {
        setWhiteTimeMs((t) => t + timeControl.incrementSeconds * 1000);
      } else {
        setBlackTimeMs((t) => t + timeControl.incrementSeconds * 1000);
      }
    }

    // Reset hints
    setHintLevel(0);
    setHintText('');
    setHintSquare(undefined);

    // Start clocks if not running
    if (!isClockRunning) {
      setIsClockRunning(true);
    }

    // Evaluate position with Stockfish
    updateEngineAnalysis(chess.fen());

    // Check game termination
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'Black' : 'White';
      const res = chess.turn() === 'w' ? '0-1' : '1-0';
      finishGame(res, 'Checkmate', `${winner} wins by checkmate!`);
    } else if (chess.isDraw()) {
      let reason = 'Draw by agreement';
      if (chess.isStalemate()) reason = 'Draw by stalemate';
      else if (chess.isThreefoldRepetition()) reason = 'Draw by threefold repetition';
      else if (chess.isInsufficientMaterial()) reason = 'Draw by insufficient material';
      finishGame('1/2-1/2', 'Draw', reason);
    } else {
      // Auto-save unfinished match
      saveUnfinishedState();
    }
  };

  const handleUserMove = (move: { from: string; to: string; promotion?: string }) => {
    if (isAiThinking || chess.isGameOver() || gameOverModal.isOpen) return;
    if (chess.turn() !== playerColor) return;

    try {
      const moveRes = chess.move(move);
      if (moveRes) {
        handlePostMove(moveRes, move.from, move.to);
      }
    } catch {
      soundManager.playError();
    }
  };

  const saveUnfinishedState = () => {
    storageService.saveUnfinishedGame({
      id: 'ai_current',
      gameMode: 'ai',
      fen: chess.fen(),
      pgn: chess.pgn(),
      moves: chess.history(),
      whitePlayer: playerColor === 'w' ? settings.displayName : `Stockfish (${difficulty})`,
      blackPlayer: playerColor === 'b' ? settings.displayName : `Stockfish (${difficulty})`,
      playerColor,
      aiDifficulty: difficulty,
      timeControl,
      whiteTimeMs,
      blackTimeMs,
      lastTurnTime: Date.now(),
      timestamp: Date.now(),
    });
  };

  const finishGame = (
    result: '1-0' | '0-1' | '1/2-1/2' | '*',
    title: string,
    subtitle: string
  ) => {
    setIsClockRunning(false);
    storageService.clearUnfinishedGame();

    const opening = identifyOpening(chess.history());
    const saved: SavedGame = {
      id: `game_${Date.now()}`,
      date: new Date().toLocaleDateString(),
      whitePlayer: playerColor === 'w' ? settings.displayName : `Stockfish (${difficulty})`,
      blackPlayer: playerColor === 'b' ? settings.displayName : `Stockfish (${difficulty})`,
      result,
      reason: subtitle,
      moves: chess.history(),
      pgn: chess.pgn(),
      initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      finalFen: chess.fen(),
      timeControl: isUnlimited ? 'Unlimited' : `${timeControl.initialMinutes}+${timeControl.incrementSeconds}`,
      gameMode: 'ai',
      aiDifficulty: difficulty,
      playerColor,
      opening: opening ? { name: opening.name, eco: opening.eco } : undefined,
    };

    storageService.saveGame(saved);

    setGameOverModal({
      isOpen: true,
      title,
      subtitle,
      result,
    });
  };

  // Resign & Draw
  const handleResign = () => {
    const winner = playerColor === 'w' ? 'Black (Stockfish)' : 'White (Stockfish)';
    const res = playerColor === 'w' ? '0-1' : '1-0';
    soundManager.playGameOver();
    finishGame(res, 'Resignation', `${winner} won by resignation.`);
  };

  const handleOfferDraw = () => {
    // Engine accepts draw if evaluation is balanced (between -70 and +70 cp)
    if (Math.abs(evaluation.score) < 75 && moves.length > 20) {
      soundManager.playGameOver();
      finishGame('1/2-1/2', 'Draw Agreed', 'AI accepted your draw offer.');
    } else {
      alert('Stockfish evaluated the position as advantageous and declined the draw offer.');
    }
  };

  // Undo move (takes back 2 ply: player's move and AI's move)
  const handleUndo = () => {
    if (isAiThinking || moves.length < 2) return;
    chess.undo();
    chess.undo();
    setMoves([...chess.history()]);
    setCurrentMoveIndex(chess.history().length - 1);
    setLastMove(null);
    setRenderTrigger((r) => r + 1);
    updateEngineAnalysis(chess.fen());
  };

  // Progressive Hints
  const handleRequestHint = () => {
    const bestUci = evaluation.bestMove;
    if (!bestUci) return;

    const explanation = explainMove(chess.fen(), bestUci);
    const nextLevel = (hintLevel + 1) % 4;
    setHintLevel(nextLevel);

    if (nextLevel === 1) {
      setHintText(explanation.level1Hint);
      setHintSquare(explanation.from);
    } else if (nextLevel === 2) {
      setHintText(explanation.level2Hint);
      setHintSquare(explanation.to);
    } else if (nextLevel === 3) {
      setHintText(explanation.level3Hint);
      setHintSquare(undefined);
    } else {
      setHintText('');
      setHintSquare(undefined);
    }
  };

  // Arrows to show
  const arrows: BoardArrow[] = [];
  if (showEngine && evaluation.bestMove && evaluation.bestMove.length >= 4) {
    arrows.push({
      from: evaluation.bestMove.slice(0, 2),
      to: evaluation.bestMove.slice(2, 4),
      color: '#10B981', // green best move arrow
    });
  }

  // Start new match
  const startMatch = (color: PieceColor) => {
    const chosenColor = color === 'w' || color === 'b' ? color : Math.random() > 0.5 ? 'w' : 'b';
    setPlayerColor(chosenColor);
    chess.reset();
    setMoves([]);
    setAnalyses([]);
    setCurrentMoveIndex(-1);
    setLastMove(null);
    setWhiteTimeMs(timeControl.initialMinutes * 60 * 1000);
    setBlackTimeMs(timeControl.initialMinutes * 60 * 1000);
    setIsClockRunning(false);
    setGameOverModal({ isOpen: false, title: '', subtitle: '', result: '*' });
    setInSetup(false);
    soundManager.playGameStart();
    updateEngineAnalysis(chess.fen());
  };

  if (inSetup) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 animate-in fade-in">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-100 uppercase tracking-wide">
              Play vs Stockfish AI
            </h1>
            <p className="text-xs text-zinc-400">
              Configure engine strength, time control, and side.
            </p>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Engine Difficulty
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'beginner', label: 'Beginner', elo: '~1100' },
                  { id: 'intermediate', label: 'Intermediate', elo: '~1500' },
                  { id: 'advanced', label: 'Advanced', elo: '~2000' },
                  { id: 'expert', label: 'Expert', elo: '~2600' },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    difficulty === d.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-xs font-bold block">{d.label}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{d.elo}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Choose Your Side
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPlayerColor('w')}
                className={`py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  playerColor === 'w'
                    ? 'bg-zinc-100 text-zinc-950 border-white shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white border border-zinc-400" />
                <span>White</span>
              </button>

              <button
                onClick={() => setPlayerColor('b')}
                className={`py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  playerColor === 'b'
                    ? 'bg-zinc-800 text-zinc-100 border-zinc-500 shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border border-zinc-600" />
                <span>Black</span>
              </button>

              <button
                onClick={() => setPlayerColor(Math.random() > 0.5 ? 'w' : 'b')}
                className="py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>🎲 Random</span>
              </button>
            </div>
          </div>

          {/* Time Controls */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Time Control
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Blitz 3+2', min: 3, inc: 2 },
                { name: 'Blitz 5+0', min: 5, inc: 0 },
                { name: 'Rapid 10+0', min: 10, inc: 0 },
                { name: 'Rapid 15+10', min: 15, inc: 10 },
                { name: 'Bullet 1+0', min: 1, inc: 0 },
                { name: 'Bullet 2+1', min: 2, inc: 1 },
                { name: 'Classical 30+0', min: 30, inc: 0 },
                { name: 'Unlimited', min: 0, inc: 0 },
              ].map((tc) => (
                <button
                  key={tc.name}
                  onClick={() => setTimeControl({ initialMinutes: tc.min, incrementSeconds: tc.inc })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    timeControl.initialMinutes === tc.min && timeControl.incrementSeconds === tc.inc
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {tc.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => startMatch(playerColor)}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Game</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in">
      {/* Top Clocks */}
      <GameClock
        whiteTimeMs={whiteTimeMs}
        blackTimeMs={blackTimeMs}
        activeColor={isClockRunning ? chess.turn() : null}
        whiteName={playerColor === 'w' ? settings.displayName : `Stockfish (${difficulty})`}
        blackName={playerColor === 'b' ? settings.displayName : `Stockfish (${difficulty})`}
        isUnlimited={isUnlimited}
      />

      {/* Main Gameplay Layout: Eval Bar + Chessboard + Side Panel */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
        {/* Left: Evaluation Bar */}
        {showEngine && (
          <div className="hidden sm:block h-[560px]">
            <EvaluationBar evaluation={evaluation} orientation={playerColor} />
          </div>
        )}

        {/* Center: Interactive Chessboard */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[560px]">
          <ChessBoard
            chess={chess}
            orientation={playerColor}
            theme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            showCoordinates={settings.showCoordinates}
            showLegalMoves={settings.showLegalMoves}
            showLastMoveHighlight={settings.showLastMoveHighlight}
            arrows={arrows}
            hintSquare={hintSquare}
            disabled={isAiThinking || chess.isGameOver()}
            onMove={handleUserMove}
            lastMove={lastMove}
          />

          {/* Quick Actions Bar */}
          <div className="w-full grid grid-cols-5 gap-2 select-none">
            <button
              onClick={handleUndo}
              disabled={moves.length < 2 || isAiThinking}
              title="Takeback 1 move"
              className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            <button
              onClick={handleOfferDraw}
              disabled={chess.isGameOver()}
              className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Draw</span>
            </button>

            <button
              onClick={handleResign}
              disabled={chess.isGameOver()}
              className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resign</span>
            </button>

            <button
              onClick={() => setShowEngine(!showEngine)}
              className={`py-2 px-2 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                showEngine
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {showEngine ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Eval</span>
            </button>

            <button
              onClick={() => setInSetup(true)}
              className="py-2 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-amber-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Setup</span>
            </button>
          </div>
        </div>

        {/* Right: Engine Panel & Move History */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
          {showEngine && (
            <EnginePanel
              evaluation={evaluation}
              isEngineActive={showEngine}
              onToggleEngine={() => setShowEngine(!showEngine)}
              bestMoveSan={evaluation.bestMoveSan}
              depth={engineDepth}
              onSelectDepth={setEngineDepth}
              hintLevel={hintLevel}
              hintText={hintText}
              onRequestHint={handleRequestHint}
              isThinking={isAiThinking}
            />
          )}

          <MoveHistory
            moves={moves}
            analyses={analyses}
            currentMoveIndex={currentMoveIndex}
            onSelectMove={(idx) => setCurrentMoveIndex(idx)}
            onFirst={() => setCurrentMoveIndex(-1)}
            onPrev={() => setCurrentMoveIndex((idx) => Math.max(-1, idx - 1))}
            onNext={() => setCurrentMoveIndex((idx) => Math.min(moves.length - 1, idx + 1))}
            onLast={() => setCurrentMoveIndex(moves.length - 1)}
          />
        </div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameOverModal.isOpen}
        title={gameOverModal.title}
        subtitle={gameOverModal.subtitle}
        onNewGame={() => setInSetup(true)}
        onReviewGame={() => {
          const lastSaved = storageService.getSavedGames()[0];
          if (lastSaved && onReviewGame) {
            onReviewGame(lastSaved);
          }
        }}
        onGoHome={onGoHome}
      />
    </div>
  );
};
