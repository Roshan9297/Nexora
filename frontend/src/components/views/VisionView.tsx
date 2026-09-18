'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserSettings } from '@/types';
import { analyzeVision } from '@/lib/api';
import { Eye, Image as ImageIcon, Sparkles, Upload, Code, FileText, CheckCircle2 } from 'lucide-react';

interface VisionViewProps {
  settings: UserSettings;
}

export const VisionView: React.FC<VisionViewProps> = ({ settings }) => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [prompt, setPrompt] = useState('Describe and analyze this image in detail.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (customPrompt?: string) => {
    if (!imageBase64) return;
    const activePrompt = customPrompt || prompt;
    setIsAnalyzing(true);
    try {
      const res = await analyzeVision(imageBase64, mimeType, activePrompt, settings);
      setResult(res.analysis || res.error || 'No response returned.');
    } catch (err: any) {
      setResult(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10] p-6 space-y-4">
      {/* Top Banner */}
      <div className="bg-[#121622] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Eye className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Multimodal Vision Agent</h2>
            <p className="text-xs text-gray-400">
              Inspect images, convert UI wireframes to React Tailwind code, extract diagram logic, and perform OCR.
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all">
          <Upload className="w-4 h-4" />
          <span>Upload Image</span>
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
      </div>

      {/* Main Workspace */}
      {imageBase64 ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
          {/* Left: Image Preview & Quick Actions */}
          <div className="flex flex-col bg-[#121622] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <span className="font-semibold text-xs text-white">Image Preview</span>
              <span className="text-[11px] text-gray-400 font-mono">{mimeType}</span>
            </div>

            <div className="flex-1 p-6 flex items-center justify-center bg-black/40 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageBase64}
                alt="Upload preview"
                className="max-h-80 max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="p-4 border-t border-white/5 grid grid-cols-3 gap-2 bg-[#121622]">
              <button
                onClick={() => {
                  const p = 'Convert this user interface / mockup into clean Next.js React with Tailwind CSS.';
                  setPrompt(p);
                  handleAnalyze(p);
                }}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/40 text-gray-300 text-xs font-medium flex flex-col items-center gap-1.5 transition-colors"
              >
                <Code className="w-4 h-4 text-cyan-400" />
                <span>UI to React Code</span>
              </button>
              <button
                onClick={() => {
                  const p = 'Extract all printed and handwritten text accurately from this image (OCR).';
                  setPrompt(p);
                  handleAnalyze(p);
                }}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 text-gray-300 text-xs font-medium flex flex-col items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>OCR Extract Text</span>
              </button>
              <button
                onClick={() => {
                  const p = 'Explain the architecture, diagram flow, and technical relationships shown here.';
                  setPrompt(p);
                  handleAnalyze(p);
                }}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/40 text-gray-300 text-xs font-medium flex flex-col items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Diagram Analysis</span>
              </button>
            </div>
          </div>

          {/* Right: AI Vision Output */}
          <div className="flex flex-col bg-[#121622] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <span className="font-semibold text-xs text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Vision Intelligence Output</span>
              </span>
              {isAnalyzing && (
                <span className="text-xs text-purple-400 animate-pulse font-mono">Analyzing image...</span>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto prose-dark text-xs">
              {result ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                  <Eye className="w-8 h-8 text-gray-400" />
                  <p className="text-xs">Click one of the quick actions or type a custom prompt below.</p>
                </div>
              )}
            </div>

            {/* Custom Prompt Input */}
            <div className="p-3 border-t border-white/5 bg-black/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask anything about this image..."
                  className="flex-1 bg-[#181d2a] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-400 outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  Analyze
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-3">
          <ImageIcon className="w-12 h-12 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">No image loaded</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Upload an image, diagram, UI design, or document snapshot to inspect with multimodal AI.
          </p>
        </div>
      )}
    </div>
  );
};
