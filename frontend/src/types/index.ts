export type AgentType =
  | 'chat'
  | 'reasoning'
  | 'coding'
  | 'document'
  | 'search'
  | 'vision'
  | 'voice'
  | 'image_gen'
  | 'rag'
  | 'browser'
  | 'jobs'
  | 'email'
  | 'calendar'
  | 'automation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thought?: string;
  timestamp: string;
  model?: string;
  sources?: Array<{ title: string; link: string; snippet?: string }>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface UserSettings {
  provider: 'pollinations' | 'groq' | 'gemini' | 'ollama' | 'lmstudio' | 'openrouter';
  model: string;
  groqKey: string;
  geminiKey: string;
  openrouterKey: string;
  ollamaUrl: string;
  lmstudioUrl: string;
  temperature: number;
  systemPrompt: string;
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  tags: string[];
  url: string;
  source: string;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  date: string;
  notes: string;
  salary?: string;
  url?: string;
  tailored_resume?: string;
  cover_letter?: string;
}

export interface DocumentInfo {
  filename: string;
  char_count: number;
  word_count: number;
  preview: string;
  text: string;
}
