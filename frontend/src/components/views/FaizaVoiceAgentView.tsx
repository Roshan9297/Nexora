'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserSettings, ChatMessage } from '@/types';
import { streamChatSSE } from '@/lib/api';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  PhoneCall,
  PhoneOff,
  Globe,
  Radio,
  Copy,
  Check,
} from 'lucide-react';

interface FaizaVoiceAgentViewProps {
  settings: UserSettings;
}

export const FaizaVoiceAgentView: React.FC<FaizaVoiceAgentViewProps> = ({ settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'faiza-welcome',
      role: 'assistant',
      content: "Hi! Good to be back. What's on your mind?",
      timestamp: 'Today 3:30 PM',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'te-IN'>('en-US');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isCallActive, setIsCallActive] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Helper: Detect Telugu script
  const isTeluguText = (text: string) => /[\u0C00-\u0C7F]/.test(text);

  // Faiza Text-to-Speech (ChatGPT / Siri style Voice Orb)
  const speakText = (text: string, msgId?: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId && msgId && speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    if (msgId) setSpeakingId(msgId);

    const cleanText = text
      .replace(/:::(song|video|game|movie|series)\{[^}]+\}:::/g, '')
      .replace(/[*#`_~>\[\]()$]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const hasTelugu = isTeluguText(cleanText) || voiceLang === 'te-IN';

    let selectedVoice = null;
    if (hasTelugu) {
      utterance.lang = 'te-IN';
      selectedVoice =
        voices.find(
          (v) =>
            (v.lang.startsWith('te') || v.lang === 'te-IN') &&
            (v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('swara') ||
              v.name.toLowerCase().includes('natural'))
        ) ||
        voices.find((v) => v.lang.startsWith('te') || v.lang === 'te-IN') ||
        voices.find(
          (v) =>
            (v.lang === 'en-IN' || v.lang === 'hi-IN') &&
            (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('swara'))
        );
    } else {
      utterance.lang = 'en-US';
      selectedVoice =
        voices.find(
          (v) =>
            v.name.toLowerCase().includes('siri') ||
            v.name.toLowerCase().includes('samantha')
        ) ||
        voices.find(
          (v) =>
            (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural')) &&
            (v.name.toLowerCase().includes('jenny') ||
              v.name.toLowerCase().includes('aria') ||
              v.name.toLowerCase().includes('sonia'))
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
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = 1.08;
    utterance.rate = 1.04;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text Microphone
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingId(null);

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = voiceLang === 'te-IN' ? 'te-IN' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      if (transcript && transcript.trim()) {
        sendMessage(transcript.trim());
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim() || isStreaming) return;

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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const historyPayload = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      let accumulated = '';
      const stream = streamChatSSE(historyPayload, settings, false);

      for await (const chunk of stream) {
        accumulated += chunk;
        let cleanContent = accumulated;
        if (accumulated.includes('<thought>') && accumulated.includes('</thought>')) {
          cleanContent = accumulated.split('</thought>')[1].trim();
        } else if (accumulated.includes('<thought>')) {
          cleanContent = '';
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: cleanContent } : msg
          )
        );
      }

      // Auto read out in Faiza voice like ChatGPT / Siri voice mode
      if (autoSpeak && accumulated.trim()) {
        speakText(accumulated, assistantMsgId);
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: `Error: ${err.message}` }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input.trim();
    setInput('');
    sendMessage(q);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isSpeaking = Boolean(speakingId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] text-white relative overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="text-xl">🌸</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black ring-2 ring-emerald-500/20 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-white">Faiza</h2>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-gray-300 font-mono">
                Siri / ChatGPT Mode
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {isSpeaking
                ? 'Speaking...'
                : isListening
                ? 'Listening...'
                : isStreaming
                ? 'Thinking...'
                : 'Connected • English & తెలుగు'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-white/10 rounded-full px-2.5 py-1 border border-white/10 text-xs">
            <Globe className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value as any)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer"
            >
              <option value="en-US" className="bg-[#111] text-white">English</option>
              <option value="te-IN" className="bg-[#111] text-white">తెలుగు (Telugu)</option>
            </select>
          </div>

          {/* Auto Read Aloud Toggle */}
          <button
            onClick={() => {
              if (autoSpeak) {
                window.speechSynthesis.cancel();
                setSpeakingId(null);
              }
              setAutoSpeak(!autoSpeak);
            }}
            className={`p-2 rounded-full border transition-colors ${
              autoSpeak
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-transparent border-white/5 text-gray-500'
            }`}
            title={autoSpeak ? 'Auto Voice Playback On' : 'Voice Playback Muted'}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Messages Area (Clean ChatGPT Black Theme) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-16 py-8 space-y-6">
        <div className="text-center text-xs text-gray-500 font-medium">
          Today 3:30 PM
        </div>

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isMsgSpeaking = speakingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-2xl ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              {/* Message Content */}
              {isUser ? (
                <div className="rounded-2xl px-4 py-2.5 text-sm bg-[#1a4478] text-white max-w-lg shadow-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="space-y-2 text-left max-w-xl">
                  <div className="text-[15px] leading-relaxed text-gray-100 font-normal">
                    {msg.content}
                  </div>

                  {/* Message Action Controls (Like ChatGPT icon bar) */}
                  <div className="flex items-center gap-3 text-gray-500 text-xs pt-1">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-white transition-colors"
                      title="Copy"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => speakText(msg.content, msg.id)}
                      className={`hover:text-pink-400 transition-colors flex items-center gap-1 ${
                        isMsgSpeaking ? 'text-pink-400 font-medium' : ''
                      }`}
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {isMsgSpeaking && <span className="text-[10px]">Playing</span>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Interactive ChatGPT / Siri Glowing Voice Orb in Center Bottom */}
      <div className="flex flex-col items-center justify-center pb-6 pt-2">
        <div className="relative flex items-center justify-center mb-4">
          {/* Animated Glow Rings when Faiza is Speaking or Listening */}
          {(isSpeaking || isListening || isStreaming) && (
            <>
              <div
                className={`absolute w-36 h-36 rounded-full blur-2xl opacity-60 animate-ping duration-1000 ${
                  isSpeaking
                    ? 'bg-blue-400/40'
                    : isListening
                    ? 'bg-pink-500/40'
                    : 'bg-indigo-500/30'
                }`}
              />
              <div
                className={`absolute w-28 h-28 rounded-full blur-xl opacity-80 animate-pulse ${
                  isSpeaking
                    ? 'bg-gradient-to-r from-blue-300 to-indigo-400'
                    : isListening
                    ? 'bg-gradient-to-r from-rose-400 to-pink-500'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                }`}
              />
            </>
          )}

          {/* Glowing Orb Button (Matches User Uploaded Image from ChatGPT) */}
          <button
            onClick={toggleListening}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-transform transform active:scale-95 shadow-2xl focus:outline-none ${
              isListening
                ? 'scale-110 ring-4 ring-rose-400/50'
                : isSpeaking
                ? 'scale-105 ring-4 ring-blue-400/50'
                : 'hover:scale-105'
            }`}
            style={{
              background: isListening
                ? 'radial-gradient(circle at 35% 35%, #ffffff 0%, #ff80b0 45%, #e11d48 90%)'
                : isSpeaking
                ? 'radial-gradient(circle at 35% 35%, #ffffff 0%, #93c5fd 40%, #2563eb 85%, #1d4ed8 100%)'
                : 'radial-gradient(circle at 35% 35%, #ffffff 0%, #bfdbfe 35%, #60a5fa 75%, #2563eb 100%)',
              boxShadow: isSpeaking
                ? '0 0 45px rgba(96, 165, 250, 0.8), inset 0 2px 8px rgba(255,255,255,0.9)'
                : isListening
                ? '0 0 45px rgba(244, 63, 94, 0.8), inset 0 2px 8px rgba(255,255,255,0.9)'
                : '0 0 35px rgba(59, 130, 246, 0.5), inset 0 2px 6px rgba(255,255,255,0.8)',
            }}
            title={isListening ? 'Listening to you... Click to Stop' : 'Click to Speak with Faiza'}
          >
            {/* Subtle inner organic wave */}
            <div className="w-12 h-12 rounded-full opacity-70 bg-white/20 blur-[2px] animate-pulse" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-3 tracking-wide">
          {isListening ? (
            <span className="text-pink-400 font-medium animate-pulse">● Listening in {voiceLang === 'te-IN' ? 'Telugu' : 'English'}...</span>
          ) : isSpeaking ? (
            <span className="text-blue-300 font-medium">Faiza is speaking... Tap orb to interrupt</span>
          ) : (
            <span>Tap the orb or speak to chat with Faiza</span>
          )}
        </p>

        {/* Text Input Fallback Bar */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl px-4 flex items-center gap-2"
        >
          <div className="flex-1 flex items-center bg-[#181818] border border-white/10 rounded-full px-4 py-2 focus-within:border-blue-500/50 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                voiceLang === 'te-IN'
                  ? 'ఫైజాతో మాట్లాడండి లేదా ఇక్కడ టైప్ చేయండి...'
                  : 'Talk or message Faiza...'
              }
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="p-1.5 rounded-full bg-white text-black hover:bg-gray-200 disabled:opacity-30 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-full border transition-all ${
              isListening
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : 'bg-[#181818] text-gray-300 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Microphone Input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
export default FaizaVoiceAgentView;
