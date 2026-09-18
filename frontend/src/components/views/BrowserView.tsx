'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSettings } from '@/types';
import { browseUrl } from '@/lib/api';
import { Globe, ArrowRight, ExternalLink, Sparkles, Compass } from 'lucide-react';

interface BrowserViewProps {
  settings: UserSettings;
}

export const BrowserView: React.FC<BrowserViewProps> = ({ settings }) => {
  const [url, setUrl] = useState('https://news.ycombinator.com');
  const [question, setQuestion] = useState('');
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [data, setData] = useState<{
    success: boolean;
    url: string;
    title: string;
    analysis: string;
    links: Array<{ text: string; url: string }>;
    error?: string;
  } | null>(null);

  const handleBrowse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim() || isBrowsing) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }

    setIsBrowsing(true);
    try {
      const res = await browseUrl(targetUrl, question, settings);
      setData(res);
    } catch (err: any) {
      alert(`Browsing error: ${err.message}`);
    } finally {
      setIsBrowsing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10] p-6 space-y-4">
      {/* Browser URL Bar */}
      <div className="bg-[#121622] border border-white/5 rounded-2xl p-4 shadow-xl">
        <form onSubmit={handleBrowse} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter web page URL (e.g. https://docs.github.com or https://techcrunch.com)..."
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs text-white placeholder-gray-400 outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!url.trim() || isBrowsing}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:opacity-90 shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>{isBrowsing ? 'Scraping & Analyzing...' : 'Browse Page'}</span>
          </button>
        </form>
      </div>

      {/* Main Analysis Display */}
      {data ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Main: AI Reading & Intelligence */}
          <div className="lg:col-span-2 flex flex-col bg-[#121622] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <span className="font-semibold text-xs text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="truncate max-w-md">{data.title}</span>
              </span>
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
              >
                Open Original <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex-1 p-6 overflow-y-auto prose-dark text-xs">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.analysis}</ReactMarkdown>
            </div>
          </div>

          {/* Right: Key Links Extracted */}
          <div className="flex flex-col bg-[#121622] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-xs text-white">
                Discovered Page Links ({data.links?.length || 0})
              </span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {data.links && data.links.length > 0 ? (
                data.links.map((lnk, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUrl(lnk.url);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all group"
                  >
                    <p className="text-xs text-cyan-300 group-hover:underline line-clamp-1">
                      {lnk.text}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">{lnk.url}</p>
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No external links found.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-3">
          <Globe className="w-12 h-12 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Live Web Browser Agent</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Enter a URL above to fetch the raw DOM, strip clutter, extract articles, and synthesize deep takeaways.
          </p>
        </div>
      )}
    </div>
  );
};
