'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSettings, DocumentInfo } from '@/types';
import { uploadDocument, analyzeDocument } from '@/lib/api';
import { FileUp, FileText, Sparkles, Send, BookOpen, CheckCircle, Info } from 'lucide-react';

interface DocumentViewProps {
  settings: UserSettings;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ settings }) => {
  const [doc, setDoc] = useState<DocumentInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [question, setQuestion] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadDocument(file);
      setDoc(res);
      setAnalysisResult(null);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSummarize = async () => {
    if (!doc) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeDocument(doc.text, doc.filename, 'summary', '', settings);
      setAnalysisResult(res.analysis);
    } catch (err: any) {
      setAnalysisResult(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc || !question.trim()) return;

    const q = question.trim();
    setIsAnalyzing(true);
    try {
      const res = await analyzeDocument(doc.text, doc.filename, 'qa', q, settings);
      setAnalysisResult(res.analysis);
    } catch (err: any) {
      setAnalysisResult(`Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10] p-6 space-y-4">
      {/* Upload Banner & Info */}
      <div className="bg-[#121622] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Document & File Analysis Agent</h2>
            <p className="text-xs text-gray-400">
              Upload all files: PDF, DOCX, Code, CSV, Sheets, JSON, or TXT. Extract text 100% locally and generate summaries or Q&A.
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:opacity-90 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all">
          <FileUp className="w-4 h-4" />
          <span>{isUploading ? 'Extracting...' : 'Upload File'}</span>
          <input
            type="file"
            accept="*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Main Content Area */}
      {doc ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
          {/* Left: Document Overview & Raw Text Preview */}
          <div className="flex flex-col bg-[#121622] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-xs text-white truncate max-w-xs">{doc.filename}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
                <span>{doc.word_count.toLocaleString()} words</span>
                <span>•</span>
                <span>{doc.char_count.toLocaleString()} chars</span>
              </div>
            </div>

            <div className="p-4 border-b border-white/5 flex gap-2">
              <button
                onClick={handleSummarize}
                disabled={isAnalyzing}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Summary</span>
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed bg-black/20">
              {doc.text}
            </div>
          </div>

          {/* Right: AI Q&A & Analysis Panel */}
          <div className="flex flex-col bg-[#121622] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <span className="font-semibold text-xs text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>NEXORA Document Insights</span>
              </span>
              {isAnalyzing && (
                <span className="text-xs text-purple-400 animate-pulse font-mono">Processing...</span>
              )}
            </div>

            <div className="flex-1 p-5 overflow-y-auto prose-dark text-xs">
              {analysisResult ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult}</ReactMarkdown>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                  <Info className="w-8 h-8 text-gray-400" />
                  <p className="text-xs">Click &quot;Executive Summary&quot; or ask any question about this document below.</p>
                </div>
              )}
            </div>

            {/* Q&A Input Bar */}
            <div className="p-3 border-t border-white/5 bg-black/20">
              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask any question about this document..."
                  className="flex-1 bg-[#181d2a] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-400 outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || isAnalyzing}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-3">
          <FileUp className="w-12 h-12 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">No document loaded</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Drag and drop or upload a PDF, Word DOCX, or text file to extract content and interact with it.
          </p>
        </div>
      )}
    </div>
  );
};
