'use client';

import React, { useState, useEffect } from 'react';
import { AgentType, ChatMessage, UserSettings } from '@/types';
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

export default function Home() {
  const [activeAgent, setActiveAgent] = useState<AgentType>('chat');
  const [reasoningMode, setReasoningMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

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

  // Load settings from localStorage on client mount
  useEffect(() => {
    try {
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#090a10] text-gray-100 select-none">
      {/* Sidebar Navigation (All 14 Agents) */}
      <Sidebar
        activeAgent={activeAgent}
        setActiveAgent={handleAgentSelect}
        openSettings={() => setIsSettingsOpen(true)}
        backendOnline={backendOnline}
        provider={settings.provider}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          activeAgent={activeAgent}
          settings={settings}
          setSettings={setSettings}
          reasoningMode={reasoningMode}
          setReasoningMode={setReasoningMode}
          onClear={handleClearSession}
          openSettings={() => setIsSettingsOpen(true)}
        />

        {/* Dynamic Agent Views */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {(activeAgent === 'chat' || activeAgent === 'reasoning' || activeAgent === 'voice') && (
            <ChatView
              settings={settings}
              reasoningMode={activeAgent === 'reasoning' || reasoningMode}
              messages={messages}
              setMessages={setMessages}
            />
          )}

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
