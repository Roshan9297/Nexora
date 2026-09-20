'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, ExternalLink, 
  Music, Film, Clapperboard, Radio, Tv, Sparkles,
  ChevronLeft, ChevronRight, Layers, ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { mediaManager } from '@/lib/mediaManager';

export interface PlayableMediaProps {
  type: 'song' | 'video' | 'game' | 'movie' | 'series';
  query?: string;
  gameName?: 'snake' | 'tictactoe' | '2048' | 'flappy' | 'pong' | 'arcade';
  platform?: 'netflix' | 'prime' | 'hotstar' | 'all';
  season?: number;
  episode?: number;
  mediaId?: string;
  autoPlay?: boolean;
}

/* =========================================================================
   1. DIGITAL CINEMA, ANIME & TV SERIES PLAYER
   ========================================================================= */
export function MoviePlayer({ 
  query, 
  targetPlatform,
  initialSeason = 1,
  initialEpisode = 1,
  mediaId,
  autoPlay = false
}: { 
  query: string; 
  targetPlatform?: string;
  initialSeason?: number;
  initialEpisode?: number;
  mediaId?: string;
  autoPlay?: boolean;
}) {
  const id = mediaId || `movie-${encodeURIComponent(query)}`;
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasPlayedBefore, setHasPlayedBefore] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [movieData, setMovieData] = useState<any>(null);
  const [selectedServer, setSelectedServer] = useState<'server1' | 'server2'>('server1');
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);

  // Synchronize with Global Media Coordinator
  useEffect(() => {
    const unsubscribe = mediaManager.subscribe((activeId) => {
      const active = activeId === id;
      setIsPlaying(active);
      if (active) setHasPlayedBefore(true);
    });
    return unsubscribe;
  }, [id]);

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
          // Only autoPlay if explicitly requested during this live session
          if (autoPlay && mediaManager.isLiveInitiated(id)) {
            mediaManager.play(id);
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query, id, autoPlay]);

  const handlePlay = () => {
    mediaManager.play(id);
  };

  const handlePause = () => {
    mediaManager.pause(id);
  };

  const imdbId = movieData?.imdbId;
  const tmdbId = movieData?.tmdbId;
  const isSeries = movieData?.mediaType === 'series';

  // If the resolved media is actually a song or music single, delegate seamlessly to SongPlayer!
  if (movieData?.mediaType === 'song' || /\b(?:single\s+by|song\s+by|music\s+video)\b/i.test(movieData?.description || '')) {
    return <SongPlayer query={movieData?.title || query} mediaId={id} autoPlay={autoPlay} />;
  }

  // Use resolved IMDb or TMDb ID
  const targetId = isSeries ? tmdbId || imdbId : imdbId || tmdbId;
  const title = movieData?.title || query;

  const getEmbedUrl = () => {
    if (!targetId) {
      return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query + (isSeries ? ' anime full episode 1' : ' full movie'))}&autoplay=1&enablejsapi=1`;
    }

    if (isSeries) {
      if (selectedServer === 'server1') {
        if (tmdbId) {
          return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=06b6d4&autoplay=true`;
        }
        return `https://www.2embed.cc/embedtv/${imdbId || targetId}&s=${season}&e=${episode}`;
      }
      return `https://www.2embed.cc/embedtv/${imdbId || tmdbId || targetId}&s=${season}&e=${episode}`;
    } else {
      if (selectedServer === 'server1') {
        return `https://vidlink.pro/movie/${tmdbId || imdbId || targetId}?primaryColor=06b6d4&autoplay=true`;
      }
      return `https://www.2embed.cc/embed/${imdbId || tmdbId || targetId}`;
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
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              {isSeries ? 'Anime / TV Series Stream' : 'Full Movie Streaming'}
            </span>
            {isSeries && (
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/50 border border-purple-500/30 px-2 py-0.5 rounded-full">
                S{season} : E{episode}
              </span>
            )}
            {isPlaying ? (
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ▶️ Playing
              </span>
            ) : hasPlayedBefore ? (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full">
                ⏸️ Paused (Ready to Resume)
              </span>
            ) : null}
          </div>

          <h3 className="text-base font-bold text-white truncate mt-1">
            {title}
          </h3>

          <p className="text-xs text-gray-300/85 line-clamp-2 mt-1 leading-relaxed">
            {movieData?.synopsis || `Stream ${title} directly in HD across digital servers.`}
          </p>
        </div>

        {/* Play / Pause Toggle in Header */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1 hover:bg-amber-500/30 transition-colors"
              title="Pause Stream"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1 hover:bg-cyan-500/30 transition-colors"
              title={hasPlayedBefore ? "Resume Stream" : "Play Stream"}
            >
              <Play className="w-3.5 h-3.5 fill-cyan-300" />
              <span>{hasPlayedBefore ? 'Resume' : 'Play'}</span>
            </button>
          )}
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
          title="Server 1: VidLink Pro HD (Clean & Ad-Free)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Server 1 (VidLink HD)</span>
        </button>

        {/* Server 2 */}
        <button
          onClick={() => setSelectedServer('server2')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            selectedServer === 'server2'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold'
              : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
          }`}
          title="Server 2: 2Embed Stream Mirror"
        >
          <span>Server 2 (2Embed HD)</span>
        </button>
      </div>

      {/* Video Player Frame with Anti-Redirect Protection & Play/Pause State */}
      {loading ? (
        <div className="aspect-video w-full rounded-xl bg-black/50 border border-white/5 flex items-center justify-center gap-3 text-sm text-cyan-400/80 font-mono">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to stream...</span>
        </div>
      ) : isPlaying ? (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl">
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : (
        /* Paused / Non-Playing Card (Ensures ZERO autoplay on refresh and pause when switching) */
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl flex items-center justify-center group">
          {movieData?.poster && (
            <img
              src={movieData.poster}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs group-hover:opacity-35 transition-opacity"
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-3 p-4 text-center">
            <button
              onClick={handlePlay}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:scale-110 active:scale-95 transition-all text-white"
              title={hasPlayedBefore ? "Resume Stream" : "Start Stream"}
            >
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
            <div>
              <p className="text-sm font-bold text-white">
                {hasPlayedBefore ? 'Stream Paused' : 'Ready to Stream'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {hasPlayedBefore ? 'Click to continue watching' : 'Click Play to stream cinema in HD'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help note */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 px-1">
        <span className="flex items-center gap-1.5 text-gray-400">
          <Clapperboard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Only one media item plays at a time. Starting another stops the previous one.</span>
        </span>
        <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">Anti-Redirect Active</span>
      </div>
    </div>
  );
}

/* =========================================================================
   2. SONG / MUSIC PLAYER
   ========================================================================= */
export function SongPlayer({ 
  query, 
  mediaId, 
  autoPlay = false 
}: { 
  query: string; 
  mediaId?: string; 
  autoPlay?: boolean; 
}) {
  const id = mediaId || `song-${encodeURIComponent(query)}`;
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasPlayedBefore, setHasPlayedBefore] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  // Synchronize with Global Media Coordinator
  useEffect(() => {
    const unsubscribe = mediaManager.subscribe((activeId) => {
      const active = activeId === id;
      setIsPlaying(active);
      if (active) setHasPlayedBefore(true);
    });
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/media/search?q=${encodeURIComponent(query)}&type=song`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.embedUrl) setEmbedUrl(data.embedUrl);
          if (data.thumbnail) setThumbnail(data.thumbnail);
          setLoading(false);
          // Only autoPlay if explicitly requested during this live session
          if (autoPlay && mediaManager.isLiveInitiated(id)) {
            mediaManager.play(id);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setEmbedUrl(`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&enablejsapi=1`);
          setLoading(false);
          if (autoPlay && mediaManager.isLiveInitiated(id)) {
            mediaManager.play(id);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query, id, autoPlay]);

  const handlePlay = () => {
    mediaManager.play(id);
  };

  const handlePause = () => {
    mediaManager.pause(id);
  };

  const activeIframeSrc = embedUrl
    ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`
    : '';

  return (
    <div className="my-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#0c101c] via-[#101726] to-[#0a0e1a] p-4 shadow-xl shadow-cyan-950/20 max-w-xl">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20">
            <Music className={`w-5 h-5 text-white ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                NEXORA Audio
              </span>
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-cyan-400 animate-pulse h-2"></span>
                  <span className="w-0.5 bg-blue-400 animate-pulse h-3"></span>
                  <span className="w-0.5 bg-purple-400 animate-pulse h-1.5"></span>
                  <span className="w-0.5 bg-emerald-400 animate-pulse h-2.5"></span>
                </div>
              ) : hasPlayedBefore ? (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 border border-amber-500/30 px-1.5 py-0.2 rounded">
                  Paused
                </span>
              ) : null}
            </div>
            <h4 className="text-sm font-semibold text-white truncate mt-0.5">
              {query || 'Playing Music Track'}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1 hover:bg-amber-500/30 transition-colors"
              title="Pause Song"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1 hover:bg-cyan-500/30 transition-colors"
              title={hasPlayedBefore ? "Resume Track" : "Play Track"}
            >
              <Play className="w-3.5 h-3.5 fill-cyan-300" />
              <span>{hasPlayedBefore ? 'Resume' : 'Play'}</span>
            </button>
          )}

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
      ) : isPlaying ? (
        <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/10">
          <div className={showVideo ? 'aspect-video w-full' : 'h-20 w-full'}>
            <iframe
              src={activeIframeSrc}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        /* Paused / Non-Playing Card (Ensures ZERO autoplay on refresh and pause when switching) */
        <div className="relative h-24 rounded-xl overflow-hidden bg-black/70 border border-white/10 flex items-center justify-between p-4 group">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={query}
              className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs group-hover:opacity-30 transition-opacity"
            />
          )}
          <div className="relative z-10 flex items-center gap-3 min-w-0">
            <button
              onClick={handlePlay}
              className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all text-white shrink-0"
              title={hasPlayedBefore ? "Resume Track" : "Play Track"}
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                {hasPlayedBefore ? '⏸️ Track Paused' : '🎵 Ready to Play'}
              </span>
              <p className="text-xs text-gray-300 truncate mt-1">
                {hasPlayedBefore ? 'Click Resume to continue listening' : 'Click to start playback'}
              </p>
            </div>
          </div>
          <div className="relative z-10 shrink-0">
            <button
              onClick={handlePlay}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-cyan-300" />
              <span>{hasPlayedBefore ? 'Resume' : 'Play Track'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. VIDEO PLAYER
   ========================================================================= */
export function VideoPlayer({ 
  query, 
  mediaId, 
  autoPlay = false 
}: { 
  query: string; 
  mediaId?: string; 
  autoPlay?: boolean; 
}) {
  const id = mediaId || `video-${encodeURIComponent(query)}`;
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasPlayedBefore, setHasPlayedBefore] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  // Synchronize with Global Media Coordinator
  useEffect(() => {
    const unsubscribe = mediaManager.subscribe((activeId) => {
      const active = activeId === id;
      setIsPlaying(active);
      if (active) setHasPlayedBefore(true);
    });
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/media/search?q=${encodeURIComponent(query)}&type=video`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.embedUrl) setEmbedUrl(data.embedUrl);
          if (data.thumbnail) setThumbnail(data.thumbnail);
          setLoading(false);
          // Only autoPlay if explicitly requested during this live session
          if (autoPlay && mediaManager.isLiveInitiated(id)) {
            mediaManager.play(id);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setEmbedUrl(`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&enablejsapi=1`);
          setLoading(false);
          if (autoPlay && mediaManager.isLiveInitiated(id)) {
            mediaManager.play(id);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query, id, autoPlay]);

  const handlePlay = () => {
    mediaManager.play(id);
  };

  const handlePause = () => {
    mediaManager.pause(id);
  };

  const activeIframeSrc = embedUrl
    ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`
    : '';

  return (
    <div className="my-3 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#0a0f1d] to-[#070a14] p-4 shadow-xl shadow-blue-950/20 max-w-2xl">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <Film className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                NEXORA Cinema
              </span>
              {isPlaying ? (
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  ▶️ Playing
                </span>
              ) : hasPlayedBefore ? (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/50 border border-amber-500/30 px-1.5 py-0.2 rounded">
                  ⏸️ Paused
                </span>
              ) : null}
            </div>
            <h4 className="text-sm font-semibold text-white truncate">
              {query || 'Featured Video'}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium flex items-center gap-1 hover:bg-amber-500/30 transition-colors"
              title="Pause Video"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1 hover:bg-blue-500/30 transition-colors"
              title={hasPlayedBefore ? "Resume Video" : "Play Video"}
            >
              <Play className="w-3.5 h-3.5 fill-blue-300" />
              <span>{hasPlayedBefore ? 'Resume' : 'Play'}</span>
            </button>
          )}

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
      </div>

      {loading ? (
        <div className="aspect-video w-full rounded-xl bg-black/40 border border-white/5 flex items-center justify-center gap-3 text-sm text-blue-400/80 font-mono">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading cinema video player...</span>
        </div>
      ) : isPlaying ? (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl">
          <iframe
            src={activeIframeSrc}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        /* Paused / Non-Playing Card (Ensures ZERO autoplay on refresh and pause when switching) */
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center group">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={query}
              className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-xs group-hover:opacity-45 transition-opacity"
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-2.5 p-4 text-center">
            <button
              onClick={handlePlay}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 active:scale-95 transition-all text-white"
              title={hasPlayedBefore ? "Resume Video" : "Play Video"}
            >
              <Play className="w-7 h-7 fill-white ml-0.5" />
            </button>
            <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              {hasPlayedBefore ? '▶️ Click to Resume Video' : '▶️ Click to Play Video'}
            </span>
          </div>
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

export default function PlayableMedia({ 
  type, 
  query = '', 
  gameName, 
  platform, 
  season = 1, 
  episode = 1,
  mediaId,
  autoPlay = false
}: PlayableMediaProps) {
  if (type === 'song') return <SongPlayer query={query} mediaId={mediaId} autoPlay={autoPlay} />;
  if (type === 'video') return <VideoPlayer query={query} mediaId={mediaId} autoPlay={autoPlay} />;
  if (type === 'game') {
    if (gameName === 'snake') return <SnakeGame />;
    if (gameName === 'tictactoe') return <TicTacToeGame />;
    if (gameName === '2048') return <Puzzle2048 />;
    return <ArcadeHub initialTab="snake" />;
  }
  return (
    <MoviePlayer 
      query={query} 
      targetPlatform={platform} 
      initialSeason={season} 
      initialEpisode={episode} 
      mediaId={mediaId} 
      autoPlay={autoPlay} 
    />
  );
}
