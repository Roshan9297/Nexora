'use client';

import React from 'react';
import { AgentType } from '@/types';
import {
  MessageSquare,
  Brain,
  Code2,
  FileText,
  Search,
  Eye,
  Mic,
  Sparkles,
  Database,
  Globe,
  Briefcase,
  Mail,
  Calendar,
  Zap,
  Settings as SettingsIcon,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeAgent: AgentType;
  setActiveAgent: (agent: AgentType) => void;
  openSettings: () => void;
  backendOnline: boolean;
  provider: string;
}

interface SidebarItem {
  id: AgentType;
  label: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

interface SidebarGroup {
  group: string;
  items: SidebarItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeAgent,
  setActiveAgent,
  openSettings,
  backendOnline,
  provider,
}) => {
  const agentGroups: SidebarGroup[] = [
    {
      group: 'Core Intelligence',
      items: [
        { id: 'chat' as AgentType, label: 'AI Chat', icon: MessageSquare, badge: 'Unified' },
        { id: 'reasoning' as AgentType, label: 'Deep Reasoning', icon: Brain, badge: 'o3 / R1' },
      ],
    },
    {
      group: 'Code & Knowledge',
      items: [
        { id: 'coding' as AgentType, label: 'Coding Agent', icon: Code2, badge: 'Runner' },
        { id: 'document' as AgentType, label: 'Document Agent', icon: FileText, badge: 'PDF/Doc' },
        { id: 'search' as AgentType, label: 'Web Search', icon: Search, badge: 'Live Free' },
        { id: 'browser' as AgentType, label: 'Browser Agent', icon: Globe, badge: 'Scraper' },
        { id: 'rag' as AgentType, label: 'RAG Knowledge Base', icon: Database, badge: 'Vector' },
      ],
    },
    {
      group: 'Creative & Multimodal',
      items: [
        { id: 'vision' as AgentType, label: 'Vision Agent', icon: Eye, badge: 'OCR/Code' },
        { id: 'voice' as AgentType, label: 'Voice Agent', icon: Mic, badge: '2-Way' },
        { id: 'image_gen' as AgentType, label: 'Image Gen', icon: Sparkles, badge: 'Flux 100% Free' },
      ],
    },
    {
      group: 'Career Powerhouse',
      items: [
        { id: 'jobs' as AgentType, label: 'Job Agent Suite', icon: Briefcase, badge: '7-in-1', highlight: true },
      ],
    },
    {
      group: 'Productivity & Workflows',
      items: [
        { id: 'email' as AgentType, label: 'Email Agent', icon: Mail, badge: 'Mailto' },
        { id: 'calendar' as AgentType, label: 'Calendar Agent', icon: Calendar, badge: '.ICS' },
        { id: 'automation' as AgentType, label: 'Automation Agent', icon: Zap, badge: 'Pipelines' },
      ],
    },
  ];

  return (
    <aside className="w-72 h-screen bg-[#0d1017]/90 border-r border-white/5 flex flex-col justify-between select-none z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-wider text-white">NEXORA</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-medium border border-cyan-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Zero-Sub Autonomous AI</p>
          </div>
        </div>
      </div>

      {/* Agents Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {agentGroups.map((grp) => (
          <div key={grp.group}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-300 px-3 mb-1.5">
              {grp.group}
            </p>
            <div className="space-y-1">
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeAgent === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveAgent(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                        : item.highlight
                        ? 'bg-gradient-to-r from-purple-500/10 to-transparent text-purple-200 border border-purple-500/20 hover:border-purple-500/40'
                        : 'text-gray-200 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-cyan-400'
                            : item.highlight
                            ? 'text-purple-400'
                            : 'text-gray-300 group-hover:text-gray-100'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                          isActive
                            ? 'bg-cyan-400/20 text-cyan-300'
                            : item.highlight
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-white/5 text-gray-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / System Status & Settings */}
      <div className="p-3 border-t border-white/5 space-y-2 bg-black/20">
        {/* Backend & Model Status Pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-rose-500'
              }`}
            />
            <span className="truncate max-w-[130px] font-mono text-[11px] text-gray-200">
              {backendOnline
                ? provider === 'pollinations'
                  ? '⚡ Zero Keys Active'
                  : provider
                : 'Connecting...'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold">NO KEYS NEEDED</span>
        </div>

        {/* Settings button */}
        <button
          onClick={openSettings}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-200 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-4 h-4 text-gray-300" />
            <span>Settings & Keys</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </aside>
  );
};
