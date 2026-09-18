'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, ExternalLink, 
  Music, Film, Gamepad2, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Sparkles, Check, Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface PlayableMediaProps {
  type: 'song' | 'video' | 'game';
  query?: string;
  gameName?: 'snake' | 'tictactoe' | '2048' | 'flappy' | 'pong' | 'arcade';
}

/* =========================================================================
   1. SONG / MUSIC PLAYER
   ========================================================================= */
export function SongPlayer({ query }: { query: string }) {
  const [loading, setLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/media/search?q=${encodeURIComponent(query)}&type=song`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.embedUrl) {
          setEmbedUrl(data.embedUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEmbedUrl(`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  return (
    <div className="my-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#0c101c] via-[#101726] to-[#0a0e1a] p-4 shadow-xl shadow-cyan-950/20 max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20">
            <Music className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                NEXORA Audio
              </span>
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-cyan-400 animate-pulse h-2"></span>
                  <span className="w-0.5 bg-blue-400 animate-pulse h-3"></span>
                  <span className="w-0.5 bg-purple-400 animate-pulse h-1.5"></span>
                  <span className="w-0.5 bg-emerald-400 animate-pulse h-2.5"></span>
                </div>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white truncate mt-0.5">
              {query || 'Playing Music Track'}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowVideo(!showVideo)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
              showVideo
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Toggle Music Video Mode"
          >
            {showVideo ? '🎬 Video' : '🎵 Audio'}
          </button>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Open in YouTube"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Player Frame */}
      {loading ? (
        <div className="h-24 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center gap-3 text-sm text-cyan-400/80 font-mono">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Tuning into stream...</span>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/10">
          <div className={showVideo ? 'aspect-video w-full' : 'h-20 w-full'}>
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   2. VIDEO PLAYER
   ========================================================================= */
export function VideoPlayer({ query }: { query: string }) {
  const [loading, setLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/media/search?q=${encodeURIComponent(query)}&type=video`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.embedUrl) {
          setEmbedUrl(data.embedUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setEmbedUrl(`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  return (
    <div className="my-3 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#0a0f1d] to-[#070a14] p-4 shadow-xl shadow-blue-950/20 max-w-2xl">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <Film className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              NEXORA Cinema
            </span>
            <h4 className="text-sm font-semibold text-white truncate">
              {query || 'Featured Video'}
            </h4>
          </div>
        </div>

        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors text-xs flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>YouTube</span>
        </a>
      </div>

      {loading ? (
        <div className="aspect-video w-full rounded-xl bg-black/40 border border-white/5 flex items-center justify-center gap-3 text-sm text-blue-400/80 font-mono">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading cinema video player...</span>
        </div>
      ) : (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. RETRO SNAKE GAME
   ========================================================================= */
export function SnakeGame() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snakeRef = useRef<{ x: number; y: number }[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const foodRef = useRef<{ x: number; y: number }>({ x: 15, y: 15 });
  const dirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });
  const nextDirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });

  const resetGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    foodRef.current = {
      x: Math.floor(Math.random() * 18) + 1,
      y: Math.floor(Math.random() * 18) + 1,
    };
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    setScore(0);
    setGameOver(false);
    setIsRunning(true);
  }, []);

  const changeDir = useCallback((dx: number, dy: number) => {
    if (dx !== 0 && dirRef.current.x === 0) nextDirRef.current = { x: dx, y: 0 };
    if (dy !== 0 && dirRef.current.y === 0) nextDirRef.current = { x: 0, y: dy };
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        changeDir(0, -1);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        changeDir(0, 1);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        changeDir(-1, 0);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        changeDir(1, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDir]);

  // Game loop
  useEffect(() => {
    if (!isRunning || gameOver) return;

    const interval = setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const gridSize = 20;
      const cell = canvas.width / gridSize;

      dirRef.current = nextDirRef.current;
      const head = {
        x: snakeRef.current[0].x + dirRef.current.x,
        y: snakeRef.current[0].y + dirRef.current.y,
      };

      // Wall collision
      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        setGameOver(true);
        setIsRunning(false);
        return;
      }

      // Self collision
      if (snakeRef.current.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setIsRunning(false);
        return;
      }

      const newSnake = [head, ...snakeRef.current];

      // Food collision
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore((prev) => {
          const next = prev + 10;
          setHighScore((h) => Math.max(h, next));
          return next;
        });
        foodRef.current = {
          x: Math.floor(Math.random() * (gridSize - 2)) + 1,
          y: Math.floor(Math.random() * (gridSize - 2)) + 1,
        };
      } else {
        newSnake.pop();
      }

      snakeRef.current = newSnake;

      // Draw
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          ctx.fillRect(c * cell + cell / 2, r * cell + cell / 2, 1.5, 1.5);
        }
      }

      // Food
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(
        foodRef.current.x * cell + cell / 2,
        foodRef.current.y * cell + cell / 2,
        cell / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // Snake
      snakeRef.current.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#22d3ee' : '#06b6d4';
        if (i === 0) {
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 10;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + 1, seg.y * cell + 1, cell - 2, cell - 2, 4);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }, 110);

    return () => clearInterval(interval);
  }, [isRunning, gameOver]);

  return (
    <div className="flex flex-col items-center bg-[#0d121f] rounded-2xl p-4 border border-emerald-500/30 max-w-sm mx-auto shadow-xl">
      <div className="w-full flex items-center justify-between mb-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-semibold">🐍 SNAKE ARCADE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Score: <b className="text-white">{score}</b></span>
          <span className="text-amber-400">Best: <b>{highScore}</b></span>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-inner">
        <canvas ref={canvasRef} width={300} height={300} className="bg-[#0a0e17] block" />

        {!isRunning && !gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
            <button
              onClick={resetGame}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Start Game
            </button>
            <p className="text-[11px] text-gray-400">Use Arrow keys or W-A-S-D</p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
            <span className="text-rose-400 font-bold text-lg">GAME OVER</span>
            <span className="text-xs text-gray-300">Final Score: {score}</span>
            <button
              onClick={resetGame}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-xs hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Play Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile/Touch D-Pad Controls */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 w-36">
        <div />
        <button
          onClick={() => changeDir(0, -1)}
          className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 active:bg-cyan-500 text-white flex items-center justify-center border border-white/10"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <div />
        <button
          onClick={() => changeDir(-1, 0)}
          className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 active:bg-cyan-500 text-white flex items-center justify-center border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => changeDir(0, 1)}
          className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 active:bg-cyan-500 text-white flex items-center justify-center border border-white/10"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => changeDir(1, 0)}
          className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 active:bg-cyan-500 text-white flex items-center justify-center border border-white/10"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   4. TIC-TAC-TOE VS NEXORA AI
   ========================================================================= */
export function TicTacToeGame() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [wins, setWins] = useState({ player: 0, ai: 0, draws: 0 });

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every((cell) => cell !== null);

  const handleClick = (i: number) => {
    if (board[i] || winner || !isXNext) return;
    const nextBoard = [...board];
    nextBoard[i] = 'X';
    setBoard(nextBoard);
    setIsXNext(false);
  };

  // AI Move (O)
  useEffect(() => {
    if (isXNext || winner || isDraw) return;

    const timer = setTimeout(() => {
      const emptyIndices = board
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length === 0) return;

      // Smart AI: check if AI can win
      for (const idx of emptyIndices) {
        const testBoard = [...board];
        testBoard[idx] = 'O';
        if (calculateWinner(testBoard) === 'O') {
          const b = [...board];
          b[idx] = 'O';
          setBoard(b);
          setIsXNext(true);
          return;
        }
      }

      // Block player
      for (const idx of emptyIndices) {
        const testBoard = [...board];
        testBoard[idx] = 'X';
        if (calculateWinner(testBoard) === 'X') {
          const b = [...board];
          b[idx] = 'O';
          setBoard(b);
          setIsXNext(true);
          return;
        }
      }

      // Take center if available
      if (emptyIndices.includes(4)) {
        const b = [...board];
        b[4] = 'O';
        setBoard(b);
        setIsXNext(true);
        return;
      }

      // Random pick
      const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const b = [...board];
      b[randomIdx] = 'O';
      setBoard(b);
      setIsXNext(true);
    }, 350);

    return () => clearTimeout(timer);
  }, [isXNext, board, winner, isDraw]);

  // Handle game end
  useEffect(() => {
    if (winner === 'X') {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setWins((prev) => ({ ...prev, player: prev.player + 1 }));
    } else if (winner === 'O') {
      setWins((prev) => ({ ...prev, ai: prev.ai + 1 }));
    } else if (isDraw) {
      setWins((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }
  }, [winner, isDraw]);

  const restart = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex flex-col items-center bg-[#0f1422] rounded-2xl p-4 border border-purple-500/30 max-w-xs mx-auto shadow-xl">
      <div className="w-full flex items-center justify-between mb-3 text-xs">
        <span className="text-purple-400 font-semibold">❌⭕ TIC-TAC-TOE VS AI</span>
        <button onClick={restart} className="text-gray-400 hover:text-white flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Score bar */}
      <div className="flex items-center justify-between w-full px-3 py-1.5 bg-black/40 rounded-xl border border-white/5 text-[11px] mb-3">
        <span className="text-cyan-400 font-medium">You (X): {wins.player}</span>
        <span className="text-gray-400">Ties: {wins.draws}</span>
        <span className="text-rose-400 font-medium">NEXORA (O): {wins.ai}</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 w-56 h-56 bg-black/50 p-2 rounded-xl border border-white/10 shadow-inner">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={Boolean(cell || winner || !isXNext)}
            className={`rounded-lg font-bold text-2xl flex items-center justify-center transition-all ${
              cell === 'X'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : cell === 'O'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20'
                : 'bg-white/5 hover:bg-white/10 border border-white/5 text-transparent'
            }`}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Status banner */}
      <div className="mt-3 text-xs font-medium text-center">
        {winner === 'X' && <span className="text-emerald-400 font-bold">🎉 You Won! Excellent move!</span>}
        {winner === 'O' && <span className="text-rose-400 font-bold">🤖 NEXORA AI Won! Try again!</span>}
        {isDraw && <span className="text-amber-400 font-bold">🤝 It's a Draw!</span>}
        {!winner && !isDraw && (
          <span className="text-gray-400">
            {isXNext ? 'Your Turn (X)' : 'NEXORA is thinking...'}
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   5. 2048 PUZZLE GAME
   ========================================================================= */
export function Game2048() {
  const [grid, setGrid] = useState<number[][]>([
    [0, 0, 0, 0],
    [0, 2, 0, 0],
    [0, 0, 2, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState(0);

  const spawnRandom = (board: number[][]) => {
    const empty: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return board;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return [...board];
  };

  const slideRow = (row: number[]) => {
    let arr = row.filter((val) => val !== 0);
    let gained = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        gained += arr[i];
        arr.splice(i + 1, 1);
      }
    }
    while (arr.length < 4) arr.push(0);
    return { row: arr, gained };
  };

  const moveLeft = () => {
    let totalGain = 0;
    const next = grid.map((row) => {
      const { row: newRow, gained } = slideRow(row);
      totalGain += gained;
      return newRow;
    });
    setScore((s) => s + totalGain);
    setGrid(spawnRandom(next));
  };

  const moveRight = () => {
    let totalGain = 0;
    const next = grid.map((row) => {
      const reversed = [...row].reverse();
      const { row: newRow, gained } = slideRow(reversed);
      totalGain += gained;
      return newRow.reverse();
    });
    setScore((s) => s + totalGain);
    setGrid(spawnRandom(next));
  };

  const moveUp = () => {
    let totalGain = 0;
    const cols = [0, 1, 2, 3].map((c) => grid.map((row) => row[c]));
    const nextCols = cols.map((col) => {
      const { row: newCol, gained } = slideRow(col);
      totalGain += gained;
      return newCol;
    });
    const next = [0, 1, 2, 3].map((r) => nextCols.map((col) => col[r]));
    setScore((s) => s + totalGain);
    setGrid(spawnRandom(next));
  };

  const moveDown = () => {
    let totalGain = 0;
    const cols = [0, 1, 2, 3].map((c) => grid.map((row) => row[c]));
    const nextCols = cols.map((col) => {
      const reversed = [...col].reverse();
      const { row: newCol, gained } = slideRow(reversed);
      totalGain += gained;
      return newCol.reverse();
    });
    const next = [0, 1, 2, 3].map((r) => nextCols.map((col) => col[r]));
    setScore((s) => s + totalGain);
    setGrid(spawnRandom(next));
  };

  const restart = () => {
    setGrid(spawnRandom([
      [0, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]));
    setScore(0);
  };

  // Tile colors
  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-slate-800 text-gray-200 border-white/10';
      case 4: return 'bg-cyan-950 text-cyan-200 border-cyan-700/50';
      case 8: return 'bg-cyan-700 text-white font-bold border-cyan-500';
      case 16: return 'bg-blue-600 text-white font-bold';
      case 32: return 'bg-indigo-600 text-white font-bold';
      case 64: return 'bg-purple-600 text-white font-bold';
      case 128: return 'bg-amber-600 text-white font-bold';
      case 256: return 'bg-rose-600 text-white font-extrabold shadow-md shadow-rose-500/40';
      case 512: return 'bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-500/40';
      case 1024:
      case 2048: return 'bg-yellow-500 text-black font-black shadow-lg shadow-yellow-500/50 animate-pulse';
      default: return 'bg-white/5 border-white/5 text-transparent';
    }
  };

  return (
    <div className="flex flex-col items-center bg-[#0d111d] rounded-2xl p-4 border border-amber-500/30 max-w-xs mx-auto shadow-xl">
      <div className="w-full flex items-center justify-between mb-3 text-xs">
        <span className="text-amber-400 font-bold flex items-center gap-1">
          <Flame className="w-3.5 h-3.5" /> 2048 PUZZLE
        </span>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-gray-400">Score: <b className="text-white">{score}</b></span>
          <button onClick={restart} className="text-gray-400 hover:text-white">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 w-60 h-60 bg-black/60 p-2.5 rounded-xl border border-white/10 shadow-inner">
        {grid.flat().map((val, idx) => (
          <div
            key={idx}
            className={`rounded-lg flex items-center justify-center text-sm font-semibold border transition-all ${getTileColor(val)}`}
          >
            {val > 0 ? val : ''}
          </div>
        ))}
      </div>

      {/* Control D-pad */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 w-36">
        <div />
        <button onClick={moveUp} className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10">
          <ArrowUp className="w-4 h-4" />
        </button>
        <div />
        <button onClick={moveLeft} className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={moveDown} className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10">
          <ArrowDown className="w-4 h-4" />
        </button>
        <button onClick={moveRight} className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   6. ARCADE HUB (Multi-game Selector)
   ========================================================================= */
export function ArcadeHub({ initialGame }: { initialGame?: string }) {
  const [activeGame, setActiveGame] = useState<string>(initialGame || 'snake');

  return (
    <div className="my-3 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0b0e18] to-[#080a12] p-4 shadow-xl max-w-md">
      {/* Game Selector Tabs */}
      <div className="flex items-center gap-1.5 mb-4 p-1 bg-black/40 rounded-xl border border-white/5 overflow-x-auto text-xs">
        {[
          { id: 'snake', label: '🐍 Snake' },
          { id: 'tictactoe', label: '❌ Tic-Tac-Toe' },
          { id: '2048', label: '🔢 2048' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveGame(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
              activeGame === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Game Display */}
      {activeGame === 'snake' && <SnakeGame />}
      {activeGame === 'tictactoe' && <TicTacToeGame />}
      {activeGame === '2048' && <Game2048 />}
    </div>
  );
}

/* =========================================================================
   7. UNIFIED PLAYABLE MEDIA DISPATCHER
   ========================================================================= */
export default function PlayableMedia({ type, query, gameName }: PlayableMediaProps) {
  if (type === 'song') {
    return <SongPlayer query={query || 'Trending Hit Music'} />;
  }
  if (type === 'video') {
    return <VideoPlayer query={query || 'Trending Video'} />;
  }
  if (type === 'game') {
    return <ArcadeHub initialGame={gameName || 'snake'} />;
  }
  return null;
}
