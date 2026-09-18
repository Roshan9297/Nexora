# 🌟 NEXORA AI — Autonomous Multi-Agent Platform
> **100% Subscription-Free ChatGPT / GPT-6 / Astra Alternative**

NEXORA AI is a full-featured, zero-subscription AI ecosystem designed to match and exceed premium AI services. It comes pre-configured with free cloud inference, local AI support, and 14 autonomous agents.

---

## 🏛️ System Architecture Flow

```
NEXORA AI
│
├── 💬 AI Chat (Streaming Markdown, LaTeX Math, Voice Input, Neural TTS)
├── 🧠 Reasoning Engine (Step-by-Step Chain-of-Thought like o3 & DeepSeek-R1)
├── 💻 Coding Agent (Code Runner for Python & JS, Bug Review, Test Generator)
├── 📄 Document Agent (PDF, DOCX, TXT local extraction, Summarizer & Q&A)
├── 🔎 Web Search Agent (Real-time live DuckDuckGo search with citation cards)
├── 👁️ Vision Agent (Multimodal image inspector, OCR, UI-to-React generator)
├── 🎙️ Voice Agent (Conversational 2-way speech-to-text & speech synthesis)
├── 🖼️ Image Generation (100% Free Flux & SDXL via Pollinations, styles, ratios)
├── 📚 RAG / Knowledge Base (Local semantic vector chunking & grounded search)
├── 🌐 Browser Agent (Live web page reader, DOM scraper, article summarizer)
├── 💼 Job Agent Suite
│     ├── 🔍 Find Jobs (Live remote/tech jobs scraper)
│     ├── 🎯 Match Jobs to Resume (ATS scoring & keyword gap analysis)
│     ├── 📝 Tailor Resume (STAR method re-writer, PDF/Markdown export)
│     ├── ✉️ Generate Cover Letter (Company & role tailored letters)
│     ├── 📋 Fill Applications (ATS screening questions answering kit)
│     ├── 📊 Track Applications (Interactive Kanban pipeline tracker)
│     └── 🎙️ Interview Preparation (AI mock interviewer with scoring & coaching)
├── 📧 Email Agent (Executive email composer with instant mailto: launcher)
├── 📅 Calendar Agent (Natural language event parsing, .ICS export & Google Cal)
└── ⚙️ Automation Agent (Multi-step autonomous agent pipelines & chained runner)
```

---

## 🚀 How to Run NEXORA AI

### Option A: One-Click Windows Launcher (Easiest)
Simply double-click:
```bat
run-nexora.bat
```
This automatically starts the FastAPI backend on port `8000`, starts Next.js on port `3000`, and launches your default web browser.

---

### Option B: Manual Terminal Startup

#### 1. Backend (Python 3.13)
```powershell
cd backend
py -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend (Next.js & React 19)
```powershell
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Zero-Subscription Strategy (How it Stays Free)

1. **Out-of-the-Box (Zero Keys Needed)**:
   - Built-in free inference via **Pollinations.ai** (unlimited text & Flux image generation).
   - Real-time web search via **DuckDuckGo** (zero API key, zero quota).
   - Document extraction via local Python libraries (`pypdf`, `python-docx`).
2. **Free Cloud Providers (Optional Boost)**:
   - **Groq Cloud** (Free API key at `console.groq.com`): LLaMA 3.3 70B & DeepSeek-R1 Distill at 300+ tok/s.
   - **Google Gemini** (Free API key at `aistudio.google.com`): Gemini 2.0 Flash with 15 RPM free quota.
   - **OpenRouter**: Free community models.
3. **Local Offline Inference**:
   - 1-click connect to **Ollama** (`http://localhost:11434`) or **LM Studio** (`http://localhost:1234`).
