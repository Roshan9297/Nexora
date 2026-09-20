'use client';

import React, { useState, useEffect } from 'react';
import { AgentType, ChatMessage, ChatSession, UserSettings } from '@/types';
import { checkBackendHealth } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { SettingsModal } from '@/components/SettingsModal';

import { ChatView } from '@/components/views/ChatView';
import { CodingView } from '@/components/views/CodingView';
import { DocumentView } from '@/components/views/DocumentView';
import { SearchView } from '@/components/views/SearchView';
import { VisionView } from '@/components/views/VisionView';
import { ImageGenView } from '@/components/views/ImageGenView';
import { RAGView } from '@/components/views/RAGView';
import { BrowserView } from '@/components/views/BrowserView';
import { JobSuiteView } from '@/components/views/JobSuiteView';
import { EmailView } from '@/components/views/EmailView';
import { CalendarView } from '@/components/views/CalendarView';
import { AutomationView } from '@/components/views/AutomationView';
import { FaizaVoiceAgentView } from '@/components/views/FaizaVoiceAgentView';

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'session-1',
    title: 'AI Name Suggestions',
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Suggest some futuristic, high-impact brand names for an autonomous AI operating system.',
        timestamp: '10:14 AM',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content:
          'Here are 5 futuristic brand names tailored for an autonomous AI operating system:\n\n1. **Nexora** — Suggests the nexus of intelligence, connection, and next-generation innovation.\n2. **AstraOS** — Evokes celestial scope, vast capabilities, and cognitive reach.\n3. **Cortexia** — Emphasizes deep neural architecture and high-level reasoning.\n4. **Synaptech** — Reflects instantaneous synaptic responsiveness and speed.\n5. **Vortex AI** — Conveys immense gravitational power in computing and data processing.',
        timestamp: '10:15 AM',
      },
    ],
  },
  {
    id: 'session-2',
    title: 'SonyLIV Crime Thrillers',
    updatedAt: Date.now() - 7200000,
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'What are the top-rated crime and thriller web series on SonyLIV with gripping plots?',
        timestamp: 'Yesterday',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content:
          'Top acclaimed crime thrillers on SonyLIV include:\n- **Scam 1992: The Harshad Mehta Story** — Iconic financial drama and investigation.\n- **Undekhi** — Gritty crime thriller set across Himachal Pradesh and West Bengal.\n- **Tabbar** — Gripping psychological family thriller.\n- **Kathmandu Connection** — Crime investigation spanning cross-border syndicates.\n- **Avrodh** — High-stakes tactical military thriller.',
        timestamp: 'Yesterday',
      },
    ],
  },
  {
    id: 'session-3',
    title: 'Rewrite Resume for JD',
    updatedAt: Date.now() - 14400000,
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'Help me tailor my resume bullet points for a Senior Full Stack Engineer role.',
        timestamp: 'Sep 17',
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content:
          'Tailored STAR bullet points:\n- Architected high-throughput microservices handling 10M+ daily events using Python FastAPI and Next.js.\n- Reduced database query latency by 48% via Redis distributed caching.\n- Mentored 4 engineers and spearheaded automated CI/CD pipeline deployments.',
        timestamp: 'Sep 17',
      },
    ],
  },
];

export default function Home() {
  const [activeAgent, setActiveAgent] = useState<AgentType>('chat');
  const [reasoningMode, setReasoningMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');

  // Default User Settings (100% Free out-of-the-box)
  const [settings, setSettings] = useState<UserSettings>({
    provider: 'pollinations',
    model: 'default',
    groqKey: '',
    geminiKey: '',
    openrouterKey: '',
    ollamaUrl: 'http://localhost:11434',
    lmstudioUrl: 'http://localhost:1234',
    temperature: 0.7,
    systemPrompt: 'You are NEXORA AI, an autonomous intelligence engine.',
  });

  // Load saved sessions & settings from localStorage
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('nexora_sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
        }
      }
      const saved = localStorage.getItem('nexora_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch {
      // ignore
    }

    // Health check poll
    const pollHealth = () => {
      checkBackendHealth().then((res) => {
        setBackendOnline(res.status === 'healthy');
      });
    };
    pollHealth();
    const interval = setInterval(pollHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Save sessions to localStorage whenever they change
  const persistSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem('nexora_sessions', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || {
    id: 'new',
    title: 'New chat',
    messages: [],
    updatedAt: Date.now(),
  };

  const setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>> = (action) => {
    setSessions((prev) => {
      const currentActive = prev.find((s) => s.id === activeSessionId);
      const currentMsgs = currentActive ? currentActive.messages : [];
      const newMsgs = typeof action === 'function' ? action(currentMsgs) : action;

      // Auto-title generation from first user message if title is default
      let title = currentActive?.title || 'New chat';
      if ((title === 'New chat' || !title) && newMsgs.length > 0) {
        const firstUser = newMsgs.find((m) => m.role === 'user');
        if (firstUser) {
          title = firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? '...' : '');
        }
      }

      const updated = prev.map((s) =>
        s.id === activeSessionId ? { ...s, title, messages: newMsgs, updatedAt: Date.now() } : s
      );

      try {
        localStorage.setItem('nexora_sessions', JSON.stringify(updated));
      } catch {
        // ignore
      }

      return updated;
    });
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New chat',
      messages: [],
      updatedAt: Date.now(),
    };
    const updated = [newSession, ...sessions];
    persistSessions(updated);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    const fallback = filtered.length > 0 ? filtered[0] : null;
    if (!fallback) {
      handleNewChat();
    } else {
      persistSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(fallback.id);
      }
    }
  };

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('nexora_settings', JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  };

  const handleClearSession = () => {
    setMessages([]);
  };

  const handleAgentSelect = (agent: AgentType) => {
    setActiveAgent(agent);
    if (agent === 'reasoning') {
      setReasoningMode(true);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec] select-none font-sans">
      {/* ChatGPT-styled Sidebar */}
      <Sidebar
        activeAgent={activeAgent}
        setActiveAgent={handleAgentSelect}
        openSettings={() => setIsSettingsOpen(true)}
        backendOnline={backendOnline}
        provider={settings.provider}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#212121]">
        {/* Top Header */}
        <Header
          activeAgent={activeAgent}
          settings={settings}
          setSettings={setSettings}
          reasoningMode={reasoningMode}
          setReasoningMode={setReasoningMode}
          onClear={handleClearSession}
          openSettings={() => setIsSettingsOpen(true)}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Dynamic Agent Views */}
        <main className="flex-1 overflow-hidden flex flex-col bg-[#212121]">
          {(activeAgent === 'chat' || activeAgent === 'reasoning') && (
            <ChatView
              settings={settings}
              reasoningMode={activeAgent === 'reasoning' || reasoningMode}
              messages={activeSession.messages}
              setMessages={setMessages}
            />
          )}

          {activeAgent === 'voice' && <FaizaVoiceAgentView settings={settings} />}
          {activeAgent === 'coding' && <CodingView settings={settings} />}
          {activeAgent === 'document' && <DocumentView settings={settings} />}
          {activeAgent === 'search' && <SearchView settings={settings} />}
          {activeAgent === 'vision' && <VisionView settings={settings} />}
          {activeAgent === 'image_gen' && <ImageGenView />}
          {activeAgent === 'rag' && <RAGView settings={settings} />}
          {activeAgent === 'browser' && <BrowserView settings={settings} />}
          {activeAgent === 'jobs' && <JobSuiteView settings={settings} />}
          {activeAgent === 'email' && <EmailView settings={settings} />}
          {activeAgent === 'calendar' && <CalendarView settings={settings} />}
          {activeAgent === 'automation' && <AutomationView settings={settings} />}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
