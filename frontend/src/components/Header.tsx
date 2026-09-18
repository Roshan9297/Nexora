'use client';

import React from 'react';
import { AgentType, UserSettings } from '@/types';
import {
  Brain,
  Trash2,
  SlidersHorizontal,
  Zap,
  Globe2,
  PanelLeftOpen,
  Wifi,
  WifiOff,
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
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
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
        {/* Network Status Badge */}
        {isOnline ? (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            title="Internet Connected - Live Streaming & Grounding Active"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
            title="NEXORA Offline Mode Active - Built-in Intelligence & Offline Arcade Ready"
          >
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span>Offline Mode</span>
          </div>
        )}

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
          className="p-2 rounded-lg bg-white/[0.04] border border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          title="Settings"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
