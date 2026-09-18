'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSettings } from '@/types';
import { searchWeb } from '@/lib/api';
import { Search, ExternalLink, Globe, Sparkles, Clock } from 'lucide-react';

interface SearchViewProps {
  settings: UserSettings;
}

export const SearchView: React.FC<SearchViewProps> = ({ settings }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<{
    query: string;
    sources: Array<{ title: string; link: string; snippet: string }>;
    answer: string;
  } | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const data = await searchWeb(query.trim(), settings);
      setResult(data);
    } catch (err: any) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const sampleSearches = [
    'Latest breakthrough in quantum computing 2026',
    'Open source AI models vs proprietary benchmarks',
    'High performance Python web frameworks',
    'Remote developer hiring market trends',
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10] p-6 space-y-4">
      {/* Search Input Bar */}
      <div className="bg-[#121622] border border-white/5 rounded-2xl p-4 shadow-xl">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the live web with zero subscriptions (real-time DuckDuckGo)..."
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:opacity-90 shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSearching ? 'Searching...' : 'Live Search'}</span>
          </button>
        </form>

        {/* Quick suggestions */}
        {!result && (
          <div className="flex items-center gap-2 mt-3 flex-wrap text-xs text-gray-400">
            <span className="text-[11px] text-gray-400">Trending:</span>
            {sampleSearches.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(s);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 text-gray-300 hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results Display */}
      {result ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Left / Main: Synthesized Answer */}
          <div className="lg:col-span-2 flex flex-col bg-[#121622] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <span className="font-semibold text-xs text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>NEXORA Grounded Web Synthesis</span>
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">Live Citations</span>
            </div>
            <div className="flex-1 p-6 overflow-y-auto prose-dark text-xs">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
            </div>
          </div>

          {/* Right: Real-time Web Sources */}
          <div className="flex flex-col bg-[#121622] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-xs text-white">Live Sources ({result.sources.length})</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {result.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-xs text-cyan-300 group-hover:underline line-clamp-1">
                      {s.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {s.snippet}
                  </p>
                  <span className="text-[10px] text-gray-400 font-mono mt-1 block truncate">
                    {s.link}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-3">
          <Globe className="w-12 h-12 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Real-time Web Search</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Enter any topic above to query DuckDuckGo for live webpages and generate synthesized insights with references.
          </p>
        </div>
      )}
    </div>
  );
};
