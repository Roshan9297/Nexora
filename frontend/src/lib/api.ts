import { UserSettings, JobApplication } from '@/types';

const API_BASE = 'http://127.0.0.1:8000';

export function getProviderConfig(settings: UserSettings) {
  let apiKey = '';
  let baseUrl = '';

  if (settings.provider === 'groq') apiKey = settings.groqKey;
  else if (settings.provider === 'gemini') apiKey = settings.geminiKey;
  else if (settings.provider === 'openrouter') apiKey = settings.openrouterKey;
  else if (settings.provider === 'ollama') baseUrl = settings.ollamaUrl;
  else if (settings.provider === 'lmstudio') baseUrl = settings.lmstudioUrl;

  return {
    provider: settings.provider,
    model: settings.model,
    api_key: apiKey || undefined,
    base_url: baseUrl || undefined,
    temperature: settings.temperature,
  };
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: String(err) };
  }
}

export async function* streamChatSSE(
  messages: Array<{ role: string; content: string }>,
  settings: UserSettings,
  reasoningMode: boolean = false
) {
  const config = getProviderConfig(settings);

  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      reasoning_mode: reasoningMode,
      ...config,
    }),
  });

  if (!res.body) throw new Error('Readable stream not supported');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const block of lines) {
      for (const line of block.split('\n')) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') return;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.token) yield parsed.token;
            if (parsed.error) yield `\n[Error: ${parsed.error}]`;
          } catch {
            // ignore malformed
          }
        }
      }
    }
  }
}

export async function searchWeb(query: string, settings: UserSettings) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...config }),
  });
  return await res.json();
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  return await res.json();
}

export async function analyzeDocument(
  text: string,
  filename: string,
  task: string,
  question: string,
  settings: UserSettings
) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/documents/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, filename, task, question, ...config }),
  });
  return await res.json();
}

export async function executeCode(language: string, code: string) {
  const res = await fetch(`${API_BASE}/api/coding/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, code }),
  });
  return await res.json();
}

export async function analyzeCode(
  code: string,
  task: string,
  language: string,
  instruction: string,
  settings: UserSettings
) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/coding/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, task, language, instruction, ...config }),
  });
  return await res.json();
}

export async function generateImage(prompt: string, style: string, aspectRatio: string, model: string) {
  const res = await fetch(`${API_BASE}/api/image/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style, aspect_ratio: aspectRatio, model }),
  });
  return await res.json();
}

export async function analyzeVision(imageBase64: string, mimeType: string, prompt: string, settings: UserSettings) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/vision/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
      prompt,
      ...config,
    }),
  });
  return await res.json();
}

export async function ingestRAG(collection: string, docId: string, title: string, content: string) {
  const res = await fetch(`${API_BASE}/api/rag/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection, doc_id: docId, title, content }),
  });
  return await res.json();
}

export async function queryRAG(collection: string, query: string, settings: UserSettings) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection, query, ...config }),
  });
  return await res.json();
}

export async function browseUrl(url: string, question: string, settings: UserSettings) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/browser/browse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, question, ...config }),
  });
  return await res.json();
}

export async function searchJobs(query: string, location: string) {
  const res = await fetch(`${API_BASE}/api/jobs/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, location }),
  });
  return await res.json();
}

export async function matchResumeToJob(resumeText: string, jobDescription: string, settings: UserSettings) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/jobs/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription, ...config }),
  });
  return await res.json();
}

export async function tailorResume(resumeText: string, jobDescription: string, settings: UserSettings) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/jobs/tailor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription, ...config }),
  });
  return await res.json();
}

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  companyName: string,
  tone: string,
  settings: UserSettings
) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/jobs/cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resume_text: resumeText,
      job_description: jobDescription,
      company_name: companyName,
      tone,
      ...config,
    }),
  });
  return await res.json();
}

export async function fillJobApplications(resumeText: string, questions: string[], settings: UserSettings) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/jobs/fill-applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_text: resumeText, questions, ...config }),
  });
  return await res.json();
}

export async function getJobApplications() {
  const res = await fetch(`${API_BASE}/api/jobs/tracker`);
  return await res.json();
}

export async function saveJobApplications(apps: JobApplication[]) {
  const res = await fetch(`${API_BASE}/api/jobs/tracker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apps),
  });
  return await res.json();
}

export async function interviewPrep(
  role: string,
  category: string,
  resumeSummary: string,
  candidateAnswer: string,
  question: string,
  settings: UserSettings
) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/jobs/interview-prep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role,
      category,
      resume_summary: resumeSummary,
      candidate_answer: candidateAnswer,
      question,
      ...config,
    }),
  });
  return await res.json();
}

export async function composeEmail(
  recipient: string,
  goal: string,
  context: string,
  tone: string,
  settings: UserSettings
) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/email/compose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient, goal, context, tone, ...config }),
  });
  return await res.json();
}

export async function parseCalendarEvent(prompt: string, settings: UserSettings) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/calendar/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...config }),
  });
  return await res.json();
}

export async function runAutomation(
  pipelineType: string,
  parameters: Record<string, any>,
  settings: UserSettings
) {
  const config = getProviderConfig(settings);
  const res = await fetch(`${API_BASE}/api/automation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pipeline_type: pipelineType, parameters, ...config }),
  });
  return await res.json();
}
