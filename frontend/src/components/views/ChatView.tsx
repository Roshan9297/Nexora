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
    recognition.lang = 'en-US';

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

  // Text-to-Speech (read aloud)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
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
    'Explain quantum computing in simple terms with a real-world analogy.',
    'Write a production-ready Python script to scrape and monitor news headlines.',
    'Design an automated system architecture for high-concurrency microservices.',
    'Review my technical background and give me high-impact interview preparation tips.',
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
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isThinking = isStreaming && Boolean(msg.thought) && !msg.content;
            const hasThought = Boolean(msg.thought);
            const isExpanded = expandedThoughts[msg.id] ?? (reasoningMode || isThinking);

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
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content || (isThinking ? '_Thinking deeply..._' : '...')}
                        </ReactMarkdown>

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
                              onClick={() => speakText(msg.content)}
                              className="hover:text-cyan-400 flex items-center gap-1 transition-colors ml-2"
                              title="Read Aloud"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
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
          className="max-w-4xl mx-auto flex items-center gap-2 bg-[#131722] border border-white/10 rounded-2xl p-1.5 focus-within:border-cyan-500/50 shadow-xl transition-all"
        >
          {/* Speech-to-text mic */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-colors ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title={isListening ? 'Stop Listening' : 'Voice Input (Speech-to-Text)'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              reasoningMode
                ? 'Ask with Deep Reasoning enabled (o3 / R1)...'
                : 'Message Nexora...'
            }
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-[#8e8e8e] outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-white text-black hover:bg-[#ececec] disabled:opacity-30 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="max-w-4xl mx-auto mt-2 text-center text-[11.5px] text-[#8e8e8e]">
          <span>Nexora can make mistakes. Verify important info.</span>
        </div>
      </div>
    </div>
  );
};
