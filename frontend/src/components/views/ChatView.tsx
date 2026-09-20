'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, UserSettings } from '@/types';
import { streamChatSSE } from '@/lib/api';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Check,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import PlayableMedia from '@/components/media/PlayableMedia';

function extractPlayableMedia(content: string, userPrompt?: string) {
  if (!content && !userPrompt) return null;

  // 1. Explicit tags from assistant
  const seriesTag = content.match(/:::series\{query="([^"]+)"(?:,\s*season="(\d+)")?(?:,\s*episode="(\d+)")?\}:::/);
  if (seriesTag) {
    return {
      type: 'series' as const,
      query: seriesTag[1],
      season: seriesTag[2] ? parseInt(seriesTag[2], 10) : 1,
      episode: seriesTag[3] ? parseInt(seriesTag[3], 10) : 1,
    };
  }

  const movieTag = content.match(/:::movie\{query="([^"]+)"(?:,\s*platform="([^"]+)")?\}:::/);
  if (movieTag) return { type: 'movie' as const, query: movieTag[1], platform: (movieTag[2] as any) || 'all' };

  const songTag = content.match(/:::song\{query="([^"]+)"\}:::/);
  if (songTag) return { type: 'song' as const, query: songTag[1] };

  const videoTag = content.match(/:::video\{query="([^"]+)"\}:::/);
  if (videoTag) return { type: 'video' as const, query: videoTag[1] };

  const gameTag = content.match(/:::game\{name="([^"]+)"\}:::/);
  if (gameTag) return { type: 'game' as const, gameName: gameTag[1] as any };

  // 2. User prompt heuristic fallback
  if (userPrompt) {
    const p = userPrompt.trim();
    if (/play\s+(?:a\s+)?game|let'?s\s+play\s+game/i.test(p)) return { type: 'game' as const, gameName: 'arcade' as const };
    if (/play\s+snake/i.test(p)) return { type: 'game' as const, gameName: 'snake' as const };
    if (/play\s+(?:tic[\s-]?tac[\s-]?toe|tictactoe)/i.test(p)) return { type: 'game' as const, gameName: 'tictactoe' as const };
    if (/play\s+2048/i.test(p)) return { type: 'game' as const, gameName: '2048' as const };

    // Anime and TV / Web Series (e.g. "play attack on titan", "play stranger things season 2 episode 3", "play naruto anime", "watch wednesday")
    const isSeriesOrAnime = /\b(?:anime|series|season|episode|show|drama|k-drama|kdrama|tv\s*series|web\s*series)\b/i.test(p);
    const knownAnimeOrSeries = /\b(?:attack\s+on\s+titan|naruto|one\s+piece|jujutsu\s+kaisen|demon\s+slayer|solo\s+leveling|bleach|dragon\s+ball|death\s+note|stranger\s+things|breaking\s+bad|game\s+of\s+thrones|wednesday|the\s+boys|loki|dark|money\s+heist|mirzapur|squid\s+game|the\s+last\s+of\s+us|peaky\s+blinders|suits|better\s+call\s+saul|house\s+of\s+cards|dexter|friends)\b/i.test(p);

    if (isSeriesOrAnime || knownAnimeOrSeries) {
      const sMatch = p.match(/(?:season|s)\s*(\d+)/i);
      const eMatch = p.match(/(?:episode|ep)\s*(\d+)/i);
      const cleanQ = p
        .replace(/^(?:play|watch|stream|show)\s+(?:the\s+)?/i, '')
        .replace(/\s+(?:season|s)\s*\d+/gi, '')
        .replace(/\s+(?:episode|ep)\s*\d+/gi, '')
        .replace(/\b(?:on|in|from)\s+(?:netflix|prime(?:\s+video)?|hotstar|disney(?:\+\s*hotstar)?|jiocinema|crunchyroll|apple(?:\s*tv)?)\b/gi, '')
        .replace(/\b(?:in|with)\s+(?:japanese|korean|english|hindi|telugu|tamil|malayalam|kannada|spanish|french|german)\b/gi, '')
        .replace(/\b(?:japanese|korean|english|hindi|telugu|tamil|malayalam|kannada|spanish|french|german)\s+(?:series|web\s*series|tv\s*series|movie|film|anime|show|drama|dub|sub)\b/gi, '')
        .replace(/\b(?:anime|series|show|tv\s*series|web\s*series|drama|k-drama|kdrama)\b/gi, '')
        .trim();
      if (cleanQ) {
        return {
          type: 'series' as const,
          query: cleanQ,
          season: sMatch ? parseInt(sMatch[1], 10) : 1,
          episode: eMatch ? parseInt(eMatch[1], 10) : 1,
        };
      }
    }

    // Video / Trailer detection
    if (/trailer|teaser|clip|video/i.test(p)) {
      const q = p.replace(/^(?:play|show|watch)\s+(?:the\s+)?/i, '').trim();
      return { type: 'video' as const, query: q };
    }

    // 2. Song / Music detection (Prioritize BEFORE movies!)
    const isSong = /\b(?:song|music|track|audio|soundtrack|listen\s+to|mp3|sing|lyrics)\b/i.test(p) ||
      /\b(?:shape\s+of\s+you|ed\s+sheeran|believer|despacito|faded|alan\s+walker|taylor\s+swift|eminem|arijit\s+singh|justin\s+bieber|coldplay|billie\s+eilish|the\s+weeknd|dua\s+lipa|bad\s+bunny|bruno\s+mars|post\s+malone|imagine\s+dragons|bts)\b/i.test(p);

    if (isSong) {
      const q = p
        .replace(/^(?:i\s+want\s+to\s+|can\s+you\s+|please\s+)?(?:play|listen\s+to|stream|sing)\s+(?:the\s+)?/i, '')
        .replace(/\b(?:in\s+(?:the\s+)?(?:new\s+)?chat|in\s+chat|here|now)\b/gi, '')
        .replace(/\b(?:song|music|track|audio|soundtrack|mp3)\b/gi, '')
        .trim();
      if (q) return { type: 'song' as const, query: q };
    }

    // 3. Movies (e.g. "play Inception", "watch Inception on Netflix", "play korean kanakaraju", "stream Oppenheimer")
    const platformMatch = p.match(/\b(?:on|in|from)\s+(netflix|prime(?:\s+video)?|hotstar|disney(?:\+\s*hotstar)?|jiocinema|apple(?:\s*tv)?)\b/i);
    const targetPlatform = platformMatch ? platformMatch[1].toLowerCase() : 'all';

    if (/^(?:i\s+want\s+to\s+|can\s+you\s+|please\s+)?(?:play|watch|stream|show)\b/i.test(p) || /\b(?:movie|film|cinema)\b/i.test(p) || platformMatch) {
      const cleanTitle = p
        .replace(/^(?:i\s+want\s+to\s+|can\s+you\s+|please\s+)?(?:play|watch|stream|show)\s+(?:the\s+)?(?:movie\s+)?/i, '')
        .replace(/\b(?:in\s+(?:the\s+)?(?:new\s+)?chat|in\s+chat|here|now)\b/gi, '')
        .replace(/\b(?:on|in|from)\s+(netflix|prime(?:\s+video)?|hotstar|disney(?:\+\s*hotstar)?|jiocinema|apple(?:\s*tv)?)\b/i, '')
        .replace(/\b(?:movie|film|cinema)\b/i, '')
        .trim();
      if (cleanTitle) {
        return { type: 'movie' as const, query: cleanTitle, platform: targetPlatform as any };
      }
    }
  }

  return null;
}

interface ChatViewProps {
  settings: UserSettings;
  reasoningMode: boolean;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  settings,
  reasoningMode,
  messages,
  setMessages,
}) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Faiza Voice Language Selector ('te-IN' | 'en-US' | 'en-IN' | 'hi-IN')
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'te-IN' | 'en-IN'>('en-US');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Helper to detect Telugu script in text
  const isTeluguText = (text: string) => /[\u0C00-\u0C7F]/.test(text);

  // Voice Speech-to-Text via Web Speech API
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Brave.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    // Multi-language recognition: English or Telugu
    recognition.lang = voiceLang === 'te-IN' ? 'te-IN' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Active audio element ref for remote neural TTS (Telugu / regional languages)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Faiza Text-to-Speech (Natural Girl's Voice with English & Universal Telugu Support)
  const speakText = (text: string, msgId?: string) => {
    // If already speaking this message, toggle stop
    if (speakingId && msgId && speakingId === msgId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (msgId) setSpeakingId(msgId);

    // Clean out markdown symbols and media tags for clear speech
    const cleanText = text
      .replace(/:::(song|video|game|movie|series)\{[^}]+\}:::/g, '')
      .replace(/[*#`_~>\[\]()$]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const hasTelugu = isTeluguText(cleanText) || voiceLang === 'te-IN';

    // 1. If text is in Telugu or user selected Telugu mode:
    // Play directly via our high-fidelity Telugu Neural TTS engine
    // (Bypasses Windows/Browser limitations where Telugu TTS voice packs are missing)
    if (hasTelugu) {
      try {
        const audio = new Audio(`/api/tts?lang=te&text=${encodeURIComponent(cleanText.slice(0, 400))}`);
        audioPlayerRef.current = audio;
        audio.onended = () => {
          setSpeakingId(null);
          audioPlayerRef.current = null;
        };
        audio.onerror = () => {
          // Fallback to browser synthesis if network audio fails
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'te-IN';
            utterance.pitch = 1.1;
            utterance.rate = 1.0;
            utterance.onend = () => setSpeakingId(null);
            utterance.onerror = () => setSpeakingId(null);
            window.speechSynthesis.speak(utterance);
          } else {
            setSpeakingId(null);
          }
        };
        audio.play().catch(() => {
          setSpeakingId(null);
        });
        return;
      } catch {
        // Continue to Web Speech API fallback
      }
    }

    // 2. For English: Use Apple Siri / Microsoft Jenny natural female voice
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();

    utterance.lang = 'en-US';
    const selectedVoice =
      voices.find(
        (v) =>
          v.name.toLowerCase().includes('siri') ||
          v.name.toLowerCase().includes('samantha')
      ) ||
      voices.find(
        (v) =>
          (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural')) &&
          (v.name.toLowerCase().includes('jenny') || v.name.toLowerCase().includes('aria') || v.name.toLowerCase().includes('sonia'))
      ) ||
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('victoria') ||
            v.name.toLowerCase().includes('karen'))
      ) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // iPhone Siri style vocal cadence
    utterance.pitch = 1.08;
    utterance.rate = 1.05;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleThought = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userPrompt = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      thought: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: settings.provider,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const historyPayload = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      let accumulated = '';
      const stream = streamChatSSE(historyPayload, settings, reasoningMode);

      for await (const chunk of stream) {
        accumulated += chunk;

        // Check if there is an explicit <thought>...</thought> tag
        let cleanContent = accumulated;
        let thoughtContent = '';

        if (accumulated.includes('<thought>') && accumulated.includes('</thought>')) {
          const parts = accumulated.split('</thought>');
          thoughtContent = parts[0].replace('<thought>', '').trim();
          cleanContent = parts.slice(1).join('</thought>').trim();
        } else if (accumulated.includes('<thought>')) {
          thoughtContent = accumulated.replace('<thought>', '').trim();
          cleanContent = '';
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: cleanContent, thought: thoughtContent }
              : msg
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: `Error connecting to AI service: ${err.message}` }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const suggestions = [
    '🎌 Play Attack on Titan Anime',
    '📺 Play Stranger Things Season 1',
    '🍿 Play Inception Movie',
    '🎬 Play Pushpa 2',
    '🎵 Play Shape of You by Ed Sheeran',
    '🐍 Play Retro Snake Game',
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10]">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center glow-cyan">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                What can NEXORA help you build today?
              </h2>
              <p className="text-sm text-gray-400">
                100% Free Autonomous AI. Ask complex questions, activate Deep Reasoning, generate code, or execute agent workflows.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-4">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(sug);
                  }}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all text-xs text-gray-300 hover:text-white"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isThinking = isStreaming && Boolean(msg.thought) && !msg.content;
            const hasThought = Boolean(msg.thought);
            const isExpanded = expandedThoughts[msg.id] ?? (reasoningMode || isThinking);

            const prevUserMsg = !isUser
              ? messages.slice(0, index).reverse().find((m) => m.role === 'user')?.content || ''
              : '';
            const mediaItem = !isUser ? extractPlayableMedia(msg.content, prevUserMsg) : null;
            const cleanDisplayContent = msg.content
              ? msg.content.replace(/:::(song|video|game|movie|series)\{[^}]+\}:::/g, '').trim()
              : '';

            return (
              <div
                key={msg.id}
                className={`flex gap-4 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div className={`space-y-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Collapsible Chain-of-Thought (Reasoning Box) */}
                  {hasThought && (
                    <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 overflow-hidden text-xs text-purple-200/90 mb-3">
                      <button
                        onClick={() => toggleThought(msg.id)}
                        className="w-full px-3.5 py-2 flex items-center justify-between bg-purple-900/30 hover:bg-purple-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                          <span>Thought Process (Chain-of-Thought)</span>
                          {isThinking && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping ml-1" />
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-3.5 whitespace-pre-wrap font-mono text-[11px] leading-relaxed border-t border-purple-500/20 text-purple-300/80 bg-black/30 max-h-60 overflow-y-auto">
                          {msg.thought}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md shadow-cyan-900/20'
                        : 'bg-[#131622] border border-white/5 text-gray-100 rounded-bl-none prose-dark'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <>
                        {/* Interactive Playable Media (Songs, Videos, Games, Movies, Anime & Series) */}
                        {mediaItem && (
                          <div className="mb-3">
                            <PlayableMedia
                              type={mediaItem.type}
                              query={mediaItem.query}
                              gameName={mediaItem.gameName}
                              platform={mediaItem.platform}
                              season={(mediaItem as any).season}
                              episode={(mediaItem as any).episode}
                            />
                          </div>
                        )}

                        {cleanDisplayContent ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {cleanDisplayContent}
                          </ReactMarkdown>
                        ) : isThinking ? (
                          <p className="text-gray-400 italic">Thinking deeply...</p>
                        ) : !mediaItem ? (
                          <p className="text-gray-500">...</p>
                        ) : null}

                        {/* Action buttons on message */}
                        {msg.content && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5 text-gray-400 text-xs">
                            <button
                              onClick={() => copyToClipboard(msg.content, msg.id)}
                              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              onClick={() => speakText(msg.content, msg.id)}
                              className={`hover:text-pink-400 flex items-center gap-1 transition-colors ml-2 ${
                                speakingId === msg.id ? 'text-pink-400 animate-pulse font-medium' : 'text-gray-400'
                              }`}
                              title={speakingId === msg.id ? "Stop Faiza's Voice" : "Listen to Faiza (Voice Assistant)"}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{speakingId === msg.id ? 'Stop Voice' : 'Listen (Faiza)'}</span>
                            </button>

                            <span className="ml-auto text-[10px] text-gray-400 font-mono">
                              {msg.timestamp}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs font-semibold text-blue-300">YOU</span>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 md:px-12 border-t border-white/5 bg-[#0d1017]/90 backdrop-blur-md">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex items-center gap-2 bg-[#131722] border border-white/10 rounded-2xl p-1.5 focus-within:border-pink-500/50 shadow-xl transition-all"
        >
          {/* Faiza Voice Language Selector */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
            <span className="text-[11px] font-semibold text-pink-400">🌸 Faiza</span>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value as any)}
              className="bg-transparent text-[11px] text-gray-300 outline-none cursor-pointer hover:text-white"
              title="Assistant Language"
            >
              <option value="en-US" className="bg-[#1a1a24] text-white">English</option>
              <option value="te-IN" className="bg-[#1a1a24] text-white">తెలుగు (Telugu)</option>
              <option value="en-IN" className="bg-[#1a1a24] text-white">English (India)</option>
            </select>
          </div>

          {/* Speech-to-text mic */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-colors ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-gray-400 hover:text-pink-300 hover:bg-pink-500/10'
            }`}
            title={isListening ? 'Stop Listening' : `Speak to Faiza in ${voiceLang === 'te-IN' ? 'Telugu' : 'English'}`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              voiceLang === 'te-IN'
                ? 'ఫైజాతో తెలుగులో మాట్లాడండి లేదా టైప్ చేయండి...'
                : reasoningMode
                ? 'Ask Faiza with Deep Reasoning enabled...'
                : 'Ask Faiza (Voice Assistant in English / తెలుగు)...'
            }
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-[#8e8e8e] outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-500 text-white hover:opacity-90 disabled:opacity-30 transition-all shadow-md font-medium"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between text-[11px] text-[#8e8e8e] px-2">
          <span>🌸 <strong>Faiza</strong>: Multi-language Voice Assistant (English &amp; తెలుగు)</span>
          <span>Nexora can make mistakes. Verify important info.</span>
        </div>
      </div>
    </div>
  );
};
