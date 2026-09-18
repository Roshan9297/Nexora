'use client';

import React, { useState } from 'react';
import { UserSettings } from '@/types';
import { X, Key, Server, Cpu, ExternalLink, Check, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [form, setForm] = useState<UserSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121622] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Engine & API Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 text-sm">
          {/* Zero-Subscription Info Box */}
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-cyan-100 mb-0.5">Zero API Keys Required • 100% Autonomous</p>
              <p className="text-cyan-200/80 leading-relaxed">
                NEXORA AI is designed to run completely without any API keys, accounts, or subscriptions! Every agent operates out-of-the-box. The key fields below are strictly optional.
              </p>
            </div>
          </div>

          {/* Active Provider */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Active LLM Engine
            </label>
            <select
              value={form.provider}
              onChange={(e) =>
                setForm({ ...form, provider: e.target.value as UserSettings['provider'] })
              }
              className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
            >
              <option value="pollinations">⚡ Zero API Key Engine (Default - 100% Free & Unlimited)</option>
              <option value="groq">🚀 Groq Cloud (Optional Free API Key)</option>
              <option value="gemini">✨ Google Gemini (Optional Free API Key)</option>
              <option value="openrouter">🌐 OpenRouter (Optional Free Models)</option>
              <option value="ollama">💻 Local Ollama (100% Offline)</option>
              <option value="lmstudio">🛠️ Local LM Studio</option>
            </select>
          </div>

          {/* Free Cloud Keys */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Free Cloud Keys (Optional)
            </h3>

            {/* Groq Key */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-300">Groq API Key</label>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Get Free Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="gsk_..."
                value={form.groqKey}
                onChange={(e) => setForm({ ...form, groqKey: e.target.value })}
                className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500"
              />
            </div>

            {/* Gemini Key */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-300">Google Gemini API Key</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Get Free Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={form.geminiKey}
                onChange={(e) => setForm({ ...form, geminiKey: e.target.value })}
                className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500"
              />
            </div>

            {/* OpenRouter Key */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-300">OpenRouter API Key</label>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Get Free Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={form.openrouterKey}
                onChange={(e) => setForm({ ...form, openrouterKey: e.target.value })}
                className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Local Engines */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Local Engines (Offline / Private)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-300 block mb-1">Ollama URL</label>
                <input
                  type="text"
                  value={form.ollamaUrl}
                  onChange={(e) => setForm({ ...form, ollamaUrl: e.target.value })}
                  className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-300 block mb-1">LM Studio URL</label>
                <input
                  type="text"
                  value={form.lmstudioUrl}
                  onChange={(e) => setForm({ ...form, lmstudioUrl: e.target.value })}
                  className="w-full bg-[#181d2a] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Model Parameters */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-300">Creativity (Temperature)</label>
              <span className="text-xs font-mono text-cyan-400">{form.temperature}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:opacity-90 flex items-center gap-2 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" /> Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
