'use client';

import React from 'react';
import { AgentType, UserSettings } from '@/types';
import {
  Brain,
  Trash2,
  SlidersHorizontal,
  Cpu,
  Zap,
  Globe2,
  PanelLeftOpen,
} from 'lucide-react';

interface HeaderProps {
  activeAgent: AgentType;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  reasoningMode: boolean;
  setReasoningMode: (val: boolean) => void;
  onClear: () => void;
  openSettings: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeAgent,
  settings,
  setSettings,
  reasoningMode,
  setReasoningMode,
  onClear,
  openSettings,
  isCollapsed,
  setIsCollapsed,
}) => {
  const titles: Record<AgentType, { name: string; subtitle: string }> = {
    chat: { name: 'AI Chat', subtitle: 'Next-Gen Multi-Turn Conversational Assistant' },
    reasoning: { name: 'Deep Reasoning Engine', subtitle: 'Step-by-step Chain-of-Thought CoT (o3 / DeepSeek-R1)' },
    coding: { name: 'Coding Agent & Sandbox', subtitle: 'Generate, Analyze & Execute Code in Python & JS' },
    document: { name: 'Document Agent', subtitle: 'PDF, DOCX & Text Extraction, Summaries & Q&A' },
    search: { name: 'Live Web Search Agent', subtitle: 'Real-time DuckDuckGo Web Search with Citations' },
    vision: { name: 'Vision Agent', subtitle: 'Multimodal Image Analysis, Diagram to Code & OCR' },
    voice: { name: 'Voice Conversational Agent', subtitle: 'Two-Way Audio Speech-to-Text & Neural Audio Playback' },
    image_gen: { name: 'Image Generation Studio', subtitle: 'Unlimited High-Definition Image Creation via Free Flux' },
    rag: { name: 'RAG Knowledge Base', subtitle: 'Semantic Vector Search & Grounded Context Q&A' },
    browser: { name: 'Browser Agent', subtitle: 'Live Web Page Scraper, Markdown Cleaner & Reader' },
    jobs: { name: 'Job Agent Suite', subtitle: 'Find Jobs, Match Resume, Tailor, Cover Letter & Interview Prep' },
    email: { name: 'Email Agent', subtitle: 'Professional Email Composer & Mailto Link Generator' },
    calendar: { name: 'Calendar Agent', subtitle: 'Natural Language Scheduling, .ICS Exporter & Google Cal' },
    automation: { name: 'Automation Agent', subtitle: 'Autonomous Multi-Step Workflow Execution Pipelines' },
  };

  const currentInfo = titles[activeAgent] || { name: 'NEXORA AI', subtitle: 'Intelligent Agent Suite' };

  return (
    <header className="h-14 border-b border-[#262626] bg-[#171717] px-4 md:px-6 flex items-center justify-between z-10">
      {/* Active Agent Info & Sidebar Expand Trigger */}
      <div className="flex items-center gap-3">
        {isCollapsed && setIsCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 rounded-lg hover:bg-[#212121] text-[#b4b4b4] hover:text-white transition-colors"
            title="Open sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            {currentInfo.name}
          </h1>
          <p className="text-[11px] text-[#8e8e8e]">{currentInfo.subtitle}</p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-3">
        {/* Deep Reasoning Mode Toggle */}
        <button
          onClick={() => setReasoningMode(!reasoningMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            reasoningMode
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-500/30'
              : 'bg-white/[0.04] text-gray-400 border-white/5 hover:text-gray-200'
          }`}
          title="Toggle Deep Chain-of-Thought Reasoning"
        >
          <Brain className={`w-3.5 h-3.5 ${reasoningMode ? 'text-purple-400 animate-pulse' : 'text-gray-400'}`} />
          <span>Reasoning {reasoningMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Model Quick Switcher */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/5 text-xs text-gray-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={settings.provider}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                provider: e.target.value as UserSettings['provider'],
              }))
            }
            aria-label="Select AI Model Provider"
            className="bg-transparent text-gray-200 outline-none cursor-pointer text-xs font-mono"
          >
            <option value="pollinations" className="bg-[#161a23] text-gray-200">
              ⚡ Zero API Key Engine (Default)
            </option>
            <option value="groq" className="bg-[#161a23] text-gray-200">
              🚀 Groq (LLaMA 3.3 70B / Free)
            </option>
            <option value="gemini" className="bg-[#161a23] text-gray-200">
              ✨ Gemini 2.0 Flash (Free)
            </option>
            <option value="openrouter" className="bg-[#161a23] text-gray-200">
              🌐 OpenRouter Free Models
            </option>
            <option value="ollama" className="bg-[#161a23] text-gray-200">
              💻 Local Ollama (Offline)
            </option>
            <option value="lmstudio" className="bg-[#161a23] text-gray-200">
              🛠️ Local LM Studio
            </option>
          </select>
        </div>

        {/* Clear Chat / View Button */}
        <button
          onClick={onClear}
          className="p-2 rounded-lg bg-white/[0.04] border border-white/5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Clear Session"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Open Settings Modal */}
        <button
          onClick={openSettings}
          className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
          title="Configure API Keys & Endpoints"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
