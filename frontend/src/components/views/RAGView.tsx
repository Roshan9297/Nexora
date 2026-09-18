'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSettings } from '@/types';
import { ingestRAG, queryRAG } from '@/lib/api';
import { Database, Plus, Search, Check, Sparkles, BookOpen, Layers } from 'lucide-react';

interface RAGViewProps {
  settings: UserSettings;
}

export const RAGView: React.FC<RAGViewProps> = ({ settings }) => {
  const [collection, setCollection] = useState('My Knowledge Base');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);

  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [ragResult, setRagResult] = useState<{
    query: string;
    chunks: Array<{ id: string; doc_title: string; content: string; score: number }>;
    answer: string;
  } | null>(null);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    setIsIngesting(true);
    try {
      await ingestRAG(collection, Date.now().toString(), docTitle.trim(), docContent.trim());
      setIngestSuccess(true);
      setDocTitle('');
      setDocContent('');
      setTimeout(() => setIngestSuccess(false), 2500);
    } catch (err: any) {
      alert(`Ingest failed: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsQuerying(true);
    try {
      const res = await queryRAG(collection, query.trim(), settings);
      setRagResult(res);
    } catch (err: any) {
      alert(`Query failed: ${err.message}`);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10] p-6 space-y-4">
      {/* Top Banner */}
      <div className="bg-[#121622] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Database className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">RAG Knowledge Base & Vector Index</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                LOCAL EMBEDDINGS
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Ingest your proprietary notes, research papers, and technical docs. Ask questions grounded strictly in your data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#181d2a] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Collection:</span>
          <input
            type="text"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="bg-transparent text-white font-mono outline-none border-b border-white/10 focus:border-cyan-400 w-36"
          />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Left: Ingest Knowledge Form */}
        <div className="lg:col-span-4 bg-[#121622] border border-white/5 rounded-2xl p-5 overflow-y-auto flex flex-col justify-between">
          <form onSubmit={handleIngest} className="space-y-4">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add Knowledge to Index</span>
            </h3>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Document Title / Topic</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g., Company Remote Work Policy 2026"
                className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Document Content / Raw Text</label>
              <textarea
                rows={9}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Paste text, notes, guidelines, or research excerpts here..."
                className="w-full bg-[#181d2a] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-400 outline-none focus:border-cyan-500 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!docTitle.trim() || !docContent.trim() || isIngesting}
              className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {ingestSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" /> Indexed Successfully!
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Ingest & Chunk Document
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-gray-400 leading-relaxed mt-4 pt-3 border-t border-white/5">
            Documents are automatically parsed, sliced into semantic overlapping chunks, and indexed in the local vector memory.
          </p>
        </div>

        {/* Right: Semantic Search & Q&A */}
        <div className="lg:col-span-8 bg-[#121622] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          {/* Query Bar */}
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <form onSubmit={handleQuery} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask any question grounded in your indexed knowledge base..."
                  className="w-full bg-[#181d2a] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-400 outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={!query.trim() || isQuerying}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isQuerying ? 'Searching...' : 'Search Index'}</span>
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {ragResult ? (
              <div className="space-y-5">
                {/* Synthesized Answer */}
                <div className="bg-[#181d2a] border border-white/5 rounded-xl p-5 prose-dark text-xs">
                  <h4 className="text-xs font-semibold text-cyan-300 flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Grounded Answer</span>
                  </h4>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{ragResult.answer}</ReactMarkdown>
                </div>

                {/* Retrieved Vector Chunks */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <span>Retrieved Knowledge Chunks ({ragResult.chunks.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ragResult.chunks.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white truncate max-w-[180px]">
                            {c.doc_title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Score: {c.score}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-4 leading-relaxed font-mono">
                          {c.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                <Database className="w-10 h-10 text-gray-400" />
                <p className="text-xs">Add your notes on the left, then ask questions here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
