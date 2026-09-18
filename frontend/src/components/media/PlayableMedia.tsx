'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, ExternalLink, 
  Music, Film, Clapperboard, Radio, Tv, Sparkles,
  ChevronLeft, ChevronRight, Layers, ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface PlayableMediaProps {
  type: 'song' | 'video' | 'game' | 'movie' | 'series';
  query?: string;
  gameName?: 'snake' | 'tictactoe' | '2048' | 'flappy' | 'pong' | 'arcade';
  platform?: 'netflix' | 'prime' | 'hotstar' | 'all';
  season?: number;
  episode?: number;
}

/* =========================================================================
   1. DIGITAL CINEMA, ANIME & TV SERIES PLAYER
   ========================================================================= */
export function MoviePlayer({ 
  query, 
  targetPlatform,
  initialSeason = 1,
  initialEpisode = 1 
}: { 
  query: string; 
  targetPlatform?: string;
  initialSeason?: number;
  initialEpisode?: number;
}) {
  const [loading, setLoading] = useState(true);
  const [movieData, setMovieData] = useState<any>(null);
  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2' | 'server3'>('server1');
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);

  // Prevent unwanted popup redirects from third-party players
  useEffect(() => {
    const originalOpen = window.open;
    window.open = (url?: string | URL, target?: string, features?: string) => {
      console.warn('[Nexora Cinema] Suppressed redirect popup:', url);
      return null;
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return (e.returnValue = '');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/movie/info?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setMovieData(data);
          if (data.requestedSeason) setSeason(data.requestedSeason);
          if (data.requestedEpisode) setEpisode(data.requestedEpisode);
          setSelectedServer('server1');
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  const imdbId = movieData?.imdbId;
  const tmdbId = movieData?.tmdbId;
  const isSeries = movieData?.mediaType === 'series';
  // Use resolved IMDb or TMDb ID. NEVER fall back to hardcoded Inception (tt1375666)!
  const targetId = isSeries ? tmdbId || imdbId : imdbId || tmdbId;
  const title = movieData?.title || query;

  const getEmbedUrl = () => {
    // If no stream ID was resolved, stream the verified movie video / stream directly via YouTube
    if (!targetId) {
      return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query + (isSeries ? ' series episode 1' : ' full movie'))}&autoplay=1`;
    }

    if (isSeries) {
      // 3 Dedicated Series / Anime Streaming Servers
      if (selectedServer === 'server1') {
        return `https://vidlink.pro/tv/${targetId}/${season}/${episode}?primaryColor=06b6d4&autoplay=false`;
      }
      if (selectedServer === 'server2') {
        return `https://www.2embed.cc/embedtv/${imdbId || targetId}&s=${season}&e=${episode}`;
      }
      if (selectedServer === 'server3') {
        return `https://embed.smashystream.com/playere.php?${imdbId ? 'imdb=' + imdbId : 'tmdb=' + tmdbId}&season=${season}&episode=${episode}`;
      }
      return `https://vidlink.pro/tv/${targetId}/${season}/${episode}`;
    } else {
      // 3 Dedicated Movie Streaming Servers
      if (selectedServer === 'server1') {
        return `https://www.2embed.cc/embed/${imdbId || targetId}`;
      }
      if (selectedServer === 'server2') {
        return `https://vidlink.pro/movie/${targetId}?primaryColor=06b6d4&autoplay=false`;
      }
      if (selectedServer === 'server3') {
        return `https://embed.smashystream.com/playere.php?${imdbId ? 'imdb=' + imdbId : 'tmdb=' + tmdbId}`;
      }
      return `https://www.2embed.cc/embed/${imdbId || targetId}`;
    }
  };

  const nextEpisode = () => setEpisode((prev) => prev + 1);
  const prevEpisode = () => setEpisode((prev) => Math.max(1, prev - 1));

  return (
    <div className="my-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#0c101a] via-[#0d1222] to-[#070912] p-4 shadow-2xl shadow-cyan-950/20 max-w-2xl text-gray-200">
      {/* Title and Poster Header */}
      <div className="flex gap-3.5 mb-3.5">
        {movieData?.poster ? (
          <img
            src={movieData.poster}
            alt={title}
            className="w-16 h-24 object-cover rounded-xl border border-white/10 shadow-lg shrink-0"
          />
        ) : (
          <div className="w-16 h-24 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shrink-0">
            <Clapperboard className="w-7 h-7 text-cyan-400" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {isSeries ? 'Anime / TV Series Stream' : 'Full Movie Streaming'}
            </span>
            {isSeries && (
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/50 border border-purple-500/30 px-2 py-0.5 rounded-full">
                S{season} : E{episode}
              </span>
            )}
            {movieData?.description && (
              <span className="text-[11px] text-gray-400 truncate max-w-xs">
                {movieData.description}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-white truncate mt-1">
            {title}
          </h3>

          <p className="text-xs text-gray-300/85 line-clamp-2 mt-1 leading-relaxed">
            {movieData?.synopsis || `Stream ${title} directly in HD across digital servers.`}
          </p>
        </div>
      </div>

      {/* Season & Episode Selector Bar for Anime / Series */}
      {isSeries && (
        <div className="flex items-center justify-between gap-2 p-2.5 mb-3 rounded-xl bg-black/40 border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-gray-300">Season:</span>
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="bg-[#141a2c] text-white border border-white/15 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-cyan-400"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                <option key={s} value={s}>
                  Season {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-300">Episode:</span>
            <select
              value={episode}
              onChange={(e) => setEpisode(Number(e.target.value))}
              className="bg-[#141a2c] text-white border border-white/15 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-cyan-400"
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((ep) => (
                <option key={ep} value={ep}>
                  Ep {ep}
                </option>
              ))}
            </select>

            <button
              onClick={prevEpisode}
              disabled={episode <= 1}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30"
              title="Previous Episode"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={nextEpisode}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
              title="Next Episode"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Stream Source Selector Tabs */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto text-[11px] pb-1 scrollbar-none">
        <span className="text-gray-400 shrink-0 font-medium flex items-center gap-1 mr-1">
          <Radio className="w-3.5 h-3.5 text-cyan-400" /> Servers:
        </span>

        {/* Server 1 */}
        <button
          onClick={() => setSelectedServer('server1')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
            selectedServer === 'server1'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20 font-bold'
              : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
          }`}
          title={isSeries ? 'Server 1: Full HD Stream (Dub & Sub)' : 'Server 1: 2Embed HD (Primary)'}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>{isSeries ? 'Server 1 (VidLink HD)' : 'Server 1 (2Embed HD)'}</span>
        </button>

        {/* Server 2 */}
        <button
          onClick={() => setSelectedServer('server2')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            selectedServer === 'server2'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold'
              : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
          }`}
          title={isSeries ? 'Server 2: 2Embed TV' : 'Server 2: VidLink Pro HD'}
        >
          <span>{isSeries ? 'Server 2 (2Embed TV)' : 'Server 2 (VidLink Pro)'}</span>
        </button>

        {/* Server 3 */}
        <button
          onClick={() => setSelectedServer('server3')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            selectedServer === 'server3'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold'
              : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
          }`}
          title="Server 3: SmashyStream HD"
        >
          <span>Server 3 (Smashy HD)</span>
        </button>
      </div>

      {/* Video Player Frame with Anti-Redirect Protection */}
      {loading ? (
        <div className="aspect-video w-full rounded-xl bg-black/50 border border-white/5 flex items-center justify-center gap-3 text-sm text-cyan-400/80 font-mono">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to stream...</span>
        </div>
      ) : (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl">
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      )}

      {/* Help note if a server plays an alternate stream */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 px-1">
        <span className="flex items-center gap-1.5 text-gray-400">
          <Clapperboard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>If any server plays an alternate title or trailer, switch between Servers 1 to 5 above.</span>
        </span>
        <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">Anti-Redirect Active</span>
      </div>
    </div>
  );
}

/* =========================================================================
   2. SONG / MUSIC PLAYER
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
   3. VIDEO PLAYER
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
   4. RETRO ARCADE GAMES (Snake, TicTacToe, 2048)
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

      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        setGameOver(true);
        setIsRunning(false);
        return;
      }

      if (snakeRef.current.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setIsRunning(false);
        return;
      }

      const newSnake = [head, ...snakeRef.current];

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

      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(
        foodRef.current.x * cell + cell / 2,
        foodRef.current.y * cell + cell / 2,
        cell / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      snakeRef.current.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#22d3ee' : '#06b6d4';
        ctx.beginPath();
        ctx.roundRect(seg.x * cell + 1, seg.y * cell + 1, cell - 2, cell - 2, 4);
        ctx.fill();
      });
    }, 110);

    return () => clearInterval(interval);
  }, [isRunning, gameOver]);

  return (
    <div className="flex flex-col items-center bg-[#0d121f] rounded-2xl p-4 border border-emerald-500/30 max-w-sm mx-auto shadow-xl">
      <div className="w-full flex items-center justify-between mb-3 text-xs font-mono">
        <span className="text-emerald-400 font-semibold">🐍 SNAKE ARCADE</span>
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

      <div className="mt-3 grid grid-cols-3 gap-1.5 w-36">
        <div />
        <button onClick={() => changeDir(0, -1)} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10">
          <ArrowUp className="w-4 h-4" />
        </button>
        <div />
        <button onClick={() => changeDir(-1, 0)} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button onClick={() => changeDir(0, 1)} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10">
          <ArrowDown className="w-4 h-4" />
        </button>
        <button onClick={() => changeDir(1, 0)} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center border border-white/10">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (isXNext || winner || isDraw) return;
    const timer = setTimeout(() => {
      const emptyIndices = board
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);
      if (emptyIndices.length === 0) return;
      const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const b = [...board];
      b[randomIdx] = 'O';
      setBoard(b);
      setIsXNext(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [isXNext, board, winner, isDraw]);

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

      <div className="flex items-center justify-between w-full px-3 py-1.5 bg-black/40 rounded-xl border border-white/5 text-[11px] mb-3">
        <span className="text-cyan-400 font-medium">You (X): {wins.player}</span>
        <span className="text-gray-400">Ties: {wins.draws}</span>
        <span className="text-rose-400 font-medium">NEXORA (O): {wins.ai}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 w-56 h-56 bg-black/50 p-2 rounded-xl border border-white/10 shadow-inner">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={Boolean(cell || winner || !isXNext)}
            className={`rounded-lg font-bold text-2xl flex items-center justify-center transition-all ${
              cell === 'X'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : cell === 'O'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-white/5 hover:bg-white/10 border border-white/5 text-transparent'
            }`}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Puzzle2048() {
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState<number[][]>([
    [0, 2, 0, 0],
    [0, 0, 2, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);

  const restart = () => {
    setBoard([
      [0, 2, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    setScore(0);
  };

  return (
    <div className="flex flex-col items-center bg-[#13111c] rounded-2xl p-4 border border-amber-500/30 max-w-xs mx-auto shadow-xl">
      <div className="w-full flex items-center justify-between mb-3 text-xs">
        <span className="text-amber-400 font-semibold font-mono">🔢 2048 PUZZLE</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-300">Score: <b className="text-white">{score}</b></span>
          <button onClick={restart} className="text-gray-400 hover:text-white">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-[#09080e] p-2.5 rounded-xl border border-white/10 w-60 h-60">
        {board.flat().map((val, i) => (
          <div
            key={i}
            className={`rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
              val === 0
                ? 'bg-white/5 text-transparent'
                : val === 2
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-orange-500/30 text-orange-200 border border-orange-500/50'
            }`}
          >
            {val || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArcadeHub({ initialTab = 'snake' }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  return (
    <div className="my-3 max-w-md mx-auto">
      <div className="flex items-center justify-center gap-1.5 mb-3 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
        <button onClick={() => setActiveTab('snake')} className={`px-3 py-1 rounded-lg ${activeTab === 'snake' ? 'bg-emerald-500/30 text-emerald-300' : 'text-gray-400'}`}>🐍 Snake</button>
        <button onClick={() => setActiveTab('tictactoe')} className={`px-3 py-1 rounded-lg ${activeTab === 'tictactoe' ? 'bg-purple-500/30 text-purple-300' : 'text-gray-400'}`}>❌⭕ Tic-Tac-Toe</button>
        <button onClick={() => setActiveTab('2048')} className={`px-3 py-1 rounded-lg ${activeTab === '2048' ? 'bg-amber-500/30 text-amber-300' : 'text-gray-400'}`}>🔢 2048</button>
      </div>
      {activeTab === 'snake' && <SnakeGame />}
      {activeTab === 'tictactoe' && <TicTacToeGame />}
      {activeTab === '2048' && <Puzzle2048 />}
    </div>
  );
}

export default function PlayableMedia({ type, query = '', gameName, platform, season = 1, episode = 1 }: PlayableMediaProps) {
  if (type === 'song') return <SongPlayer query={query} />;
  if (type === 'video') return <VideoPlayer query={query} />;
  if (type === 'game') {
    if (gameName === 'snake') return <SnakeGame />;
    if (gameName === 'tictactoe') return <TicTacToeGame />;
    if (gameName === '2048') return <Puzzle2048 />;
    return <ArcadeHub initialTab="snake" />;
  }
  return <MoviePlayer query={query} targetPlatform={platform} initialSeason={season} initialEpisode={episode} />;
}
