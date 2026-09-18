'use client';

import React, { useState } from 'react';
import { generateImage } from '@/lib/api';
import { Sparkles, Download, Wand2, RefreshCw, Eye, Image as ImageIcon } from 'lucide-react';

export const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('Cyberpunk futuristic city at night with neon lights and flying cars');
  const [style, setStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [model, setModel] = useState('flux');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const styles = [
    { id: 'photorealistic', label: 'Photorealistic', icon: '📸' },
    { id: 'cinematic', label: 'Cinematic Movie', icon: '🎬' },
    { id: 'anime', label: 'Anime & Manga', icon: '✨' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon', icon: '🌃' },
    { id: '3d_render', label: '3D Pixar / Unreal', icon: '🧊' },
    { id: 'oil_painting', label: 'Classic Oil Paint', icon: '🎨' },
    { id: 'minimalist', label: 'Clean Minimalist', icon: '📐' },
  ];

  const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:2'];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await generateImage(prompt.trim(), style, aspectRatio, model);
      setImageUrl(res.image_url);
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090a10] p-6 space-y-4">
      {/* Top Banner */}
      <div className="bg-[#121622] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Image Generation Studio</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                100% FREE • FLUX & SDXL
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Unlimited high-resolution image generation without any subscriptions, accounts, or rate limits.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleGenerate()}
          disabled={!prompt.trim() || isGenerating}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 shadow-lg shadow-pink-500/25 disabled:opacity-40 transition-all flex items-center gap-2"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          <span>{isGenerating ? 'Rendering...' : 'Generate Image'}</span>
        </button>
      </div>

      {/* Main Studio Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Controls Column */}
        <div className="lg:col-span-4 bg-[#121622] border border-white/5 rounded-2xl p-5 overflow-y-auto space-y-5">
          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Prompt Description</label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your imagination in detail..."
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-400 outline-none focus:border-pink-500 resize-none"
            />
          </div>

          {/* Style Presets */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">Aesthetic Style</label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center gap-2 transition-all ${
                    style === s.id
                      ? 'bg-pink-500/20 text-pink-200 border-pink-500/50 shadow-sm'
                      : 'bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">Aspect Ratio</label>
            <div className="flex gap-2">
              {aspectRatios.map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    aspectRatio === ar
                      ? 'bg-purple-500/20 text-purple-200 border-purple-500/50'
                      : 'bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Model Engine */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Free Render Engine</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
            >
              <option value="flux">FLUX.1 Schnell (Ultra High Quality)</option>
              <option value="turbo">SDXL Turbo (Instant Render)</option>
            </select>
          </div>
        </div>

        {/* Image Preview Canvas */}
        <div className="lg:col-span-8 bg-[#121622] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="font-semibold text-xs text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-pink-400" />
              <span>Canvas Output</span>
            </span>
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                download="nexora_generated.jpg"
                className="px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Full Resolution</span>
              </a>
            )}
          </div>

          <div className="flex-1 p-6 flex items-center justify-center bg-black/40 overflow-hidden relative">
            {isGenerating ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
                <p className="text-xs text-pink-300 animate-pulse font-mono">
                  Synthesizing pixels with Flux...
                </p>
              </div>
            ) : imageUrl ? (
              <div className="relative max-h-full max-w-full group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={prompt}
                  className="max-h-[520px] max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 text-center text-gray-400">
                <ImageIcon className="w-12 h-12 text-gray-400" />
                <p className="text-xs">Adjust parameters and click &quot;Generate Image&quot; to render.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
