'use client';

import React, { useState } from 'react';
import { UserSettings } from '@/types';
import { X, Sliders, Volume2, User, ShieldCheck, Check, Trash2 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'general' | 'personalization' | 'speech' | 'data'>('general');
  const [form, setForm] = useState<UserSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all conversation history?')) {
      localStorage.removeItem('nexora_sessions');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-[#2f2f2f] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#ececec]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2f2f2f] flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#2a2a2a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2f2f2f] px-6 gap-6 text-xs font-medium">
          {[
            { id: 'general', label: 'General', icon: Sliders },
            { id: 'personalization', label: 'Personalization', icon: User },
            { id: 'speech', label: 'Speech', icon: Volume2 },
            { id: 'data', label: 'Data Controls', icon: ShieldCheck },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-[#8e8e8e] hover:text-[#ececec]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-[#2f2f2f]/60">
                <div>
                  <p className="font-medium text-white">Theme</p>
                  <p className="text-[#8e8e8e] text-[11px]">Interface color scheme</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-[#2a2a2a] text-white font-medium">Dark (Default)</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#2f2f2f]/60">
                <div>
                  <p className="font-medium text-white">Language</p>
                  <p className="text-[#8e8e8e] text-[11px]">Primary response language</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-[#2a2a2a] text-white font-medium">English (Auto)</span>
              </div>

              <div className="py-2">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium text-white">Response Creativity (Temperature)</p>
                    <p className="text-[#8e8e8e] text-[11px]">Balance between deterministic and creative responses</p>
                  </div>
                  <span className="font-mono text-cyan-400 font-semibold">{form.temperature}</span>
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
          )}

          {/* 2. PERSONALIZATION TAB */}
          {activeTab === 'personalization' && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-white mb-1">
                  Custom Instructions
                </label>
                <p className="text-[#8e8e8e] text-[11px] mb-2">
                  What would you like Nexora to know about you to provide tailored answers?
                </p>
                <textarea
                  rows={4}
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  placeholder="e.g. I am a software engineer, prefer concise answers with code snippets in Python and TypeScript..."
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-3 text-white placeholder-[#8e8e8e] outline-none focus:border-white resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#2a2a2a]/40 border border-[#3a3a3a] text-[#8e8e8e] text-[11px] leading-relaxed">
                Custom instructions are automatically factored into every turn and agent interaction.
              </div>
            </div>
          )}

          {/* 3. SPEECH TAB */}
          {activeTab === 'speech' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-[#2f2f2f]/60">
                <div>
                  <p className="font-medium text-white">Voice Input (Speech-to-Text)</p>
                  <p className="text-[#8e8e8e] text-[11px]">Microphone dictation</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#2f2f2f]/60">
                <div>
                  <p className="font-medium text-white">Voice Playback (Text-to-Speech)</p>
                  <p className="text-[#8e8e8e] text-[11px]">Neural voice synthesis</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-medium">Natural Voice</span>
              </div>
            </div>
          )}

          {/* 4. DATA CONTROLS TAB */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-[#2f2f2f]/60">
                <div>
                  <p className="font-medium text-white">Account Plan</p>
                  <p className="text-[#8e8e8e] text-[11px]">Subscription tier</p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium">
                  Nexora Pro (Lifetime Free)
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-rose-400">Clear All Chats</p>
                  <p className="text-[#8e8e8e] text-[11px]">Delete all conversation history and reset</p>
                </div>
                <button
                  onClick={handleClearAllData}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#2f2f2f] flex justify-end gap-3 bg-[#171717]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#8e8e8e] hover:text-white hover:bg-[#2a2a2a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-[#ececec] shadow-md flex items-center gap-2 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" /> Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
