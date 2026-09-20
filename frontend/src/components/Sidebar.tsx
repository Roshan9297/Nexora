'use client';

import React, { useState } from 'react';
import { AgentType, ChatSession } from '@/types';
import {
  SquarePen,
  Library,
  Clock,
  Blocks,
  MoreHorizontal,
  Folder,
  MessageSquare,
  Search,
  PanelLeftClose,
  ChevronDown,
  Sparkles,
  Trash2,
  Settings as SettingsIcon,
  Brain,
  Code2,
  FileText,
  Eye,
  Mic,
  Image as ImageIcon,
  Database,
  Globe,
  Briefcase,
  Mail,
  Calendar,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeAgent: AgentType;
  setActiveAgent: (agent: AgentType) => void;
  openSettings: () => void;
  backendOnline: boolean;
  provider: string;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeAgent,
  setActiveAgent,
  openSettings,
  backendOnline,
  provider,
  isCollapsed,
  setIsCollapsed,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  const [showMoreAgents, setShowMoreAgents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (isCollapsed) return null;

  // Filtered chats based on quick search
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-[260px] h-screen bg-[#171717] text-[#ececec] flex flex-col justify-between border-r border-[#262626] select-none text-[13.5px] font-sans shrink-0 z-30">
      {/* 1. Header (Brand + Search + Collapse) */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-[#262626]/40">
        <span
          onClick={() => {
            setActiveAgent('chat');
            onNewChat();
          }}
          className="font-bold text-[17px] tracking-tight text-white cursor-pointer hover:opacity-90"
        >
          Nexora
        </span>

        <div className="flex items-center gap-1 text-[#b4b4b4]">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-1.5 rounded-lg hover:bg-[#212121] hover:text-white transition-colors"
            title="Search chats"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-[#212121] hover:text-white transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Search Dropdown Input */}
      {isSearchOpen && (
        <div className="px-3 py-2 border-b border-[#262626] bg-[#1a1a1a]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            autoFocus
            className="w-full bg-[#262626] rounded-md px-2.5 py-1.5 text-xs text-white placeholder-[#8e8e8e] outline-none"
          />
        </div>
      )}

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin">
        {/* Main Shortcuts List (Exact screenshot match) */}
        <div className="space-y-0.5">
          {/* New chat */}
          <button
            onClick={() => {
              setActiveAgent('chat');
              onNewChat();
            }}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-white hover:bg-[#212121] transition-colors"
          >
            <SquarePen className="w-4 h-4 text-[#b4b4b4]" />
            <span>New chat</span>
          </button>

          {/* Library */}
          <button
            onClick={() => setActiveAgent('rag')}
            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors ${
              activeAgent === 'rag'
                ? 'bg-[#212121] text-white'
                : 'text-[#ececec] hover:bg-[#212121]'
            }`}
          >
            <Library className="w-4 h-4 text-[#b4b4b4]" />
            <span>Library</span>
          </button>

          {/* Scheduled */}
          <button
            onClick={() => setActiveAgent('calendar')}
            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors ${
              activeAgent === 'calendar'
                ? 'bg-[#212121] text-white'
                : 'text-[#ececec] hover:bg-[#212121]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#b4b4b4]" />
            <span>Scheduled</span>
          </button>

          {/* Plugins */}
          <button
            onClick={() => setActiveAgent('coding')}
            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors ${
              activeAgent === 'coding'
                ? 'bg-[#212121] text-white'
                : 'text-[#ececec] hover:bg-[#212121]'
            }`}
          >
            <Blocks className="w-4 h-4 text-[#b4b4b4]" />
            <span>Plugins</span>
          </button>

          {/* More (Opens Agent Hub) */}
          <button
            onClick={() => setShowMoreAgents(!showMoreAgents)}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
              showMoreAgents
                ? 'bg-[#212121] text-white'
                : 'text-[#ececec] hover:bg-[#212121]'
            }`}
          >
            <div className="flex items-center gap-3">
              <MoreHorizontal className="w-4 h-4 text-[#b4b4b4]" />
              <span>More</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#8e8e8e] transition-transform ${
                showMoreAgents ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* More Agents Accordion Dropdown */}
          {showMoreAgents && (
            <div className="pl-3 pr-1 py-1 space-y-0.5 border-l border-[#262626] ml-3 my-1">
              {[
                { id: 'reasoning' as AgentType, label: 'Deep Reasoning', icon: Brain },
                { id: 'jobs' as AgentType, label: 'Job Agent Suite', icon: Briefcase },
                { id: 'search' as AgentType, label: 'Web Search', icon: Search },
                { id: 'browser' as AgentType, label: 'Browser Scraper', icon: Globe },
                { id: 'document' as AgentType, label: 'Document Agent', icon: FileText },
                { id: 'vision' as AgentType, label: 'Vision Agent', icon: Eye },
                { id: 'voice' as AgentType, label: 'Voice Audio', icon: Mic },
                { id: 'image_gen' as AgentType, label: 'Image Gen (Flux)', icon: ImageIcon },
                { id: 'email' as AgentType, label: 'Email Agent', icon: Mail },
                { id: 'automation' as AgentType, label: 'Automation', icon: Zap },
              ].map((ag) => {
                const Icon = ag.icon;
                const isCurrent = activeAgent === ag.id;
                return (
                  <button
                    key={ag.id}
                    onClick={() => setActiveAgent(ag.id)}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[#2f2f2f] text-white font-medium'
                        : 'text-[#b4b4b4] hover:text-white hover:bg-[#212121]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{ag.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Section: Chats */}
        <div className="space-y-1 pt-2">
          <p className="text-[11px] font-semibold text-[#8e8e8e] px-2.5">Chats</p>
          <div className="space-y-0.5">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => {
                const isActive = activeSessionId === session.id && activeAgent === 'chat';
                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      setActiveAgent('chat');
                      onSelectSession(session.id);
                    }}
                    className={`group relative w-full flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#212121] text-white font-medium'
                        : 'text-[#ececec] hover:bg-[#212121]/70'
                    }`}
                  >
                    <span className="truncate text-[13px]">{session.title}</span>

                    {/* Delete chat button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#8e8e8e] px-2.5 py-1 italic">No chats yet</p>
            )}
          </div>
        </div>
      </div>

      {/* 6. Bottom User Profile Section (Matching Screenshot) */}
      <div className="p-2 border-t border-[#262626]">
        <button
          onClick={openSettings}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#212121] transition-colors text-left group"
        >
          {/* Avatar Circle with Initials */}
          <div className="w-8 h-8 rounded-full bg-[#5f7a77] text-white font-semibold text-xs flex items-center justify-center shrink-0">
            RR
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-[13px] text-white truncate">Roshan Roy</p>
            <p className="text-[11px] text-[#8e8e8e] truncate flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Unlimited Credits
              </span>
              <span>•</span>
              <span className="text-[#3b82f6]">Pro Lifetime</span>
            </p>
          </div>

          <SettingsIcon className="w-4 h-4 text-[#8e8e8e] group-hover:text-white transition-colors" />
        </button>
      </div>
    </aside>
  );
};
