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

## 🔑 100% Zero-API-Key Architecture (How it Works with Zero Keys)

NEXORA AI operates **completely without any API keys, accounts, or subscriptions**:

| Agent / Module | Zero-Key Implementation |
| :--- | :--- |
| **AI Chat & Reasoning** | Uses high-speed anonymous reasoning inference (`openai-fast`) with multi-tier streaming and intelligent local heuristic backup. Zero keys required. |
| **Coding Agent** | Executes Python 3.13 and Node.js directly in a local sandbox environment with zero keys. Code review & test generation run on zero-key engine. |
| **Document Agent** | Local `pypdf` and `python-docx` extract text with 0 network calls. Summaries & Q&A run on zero-key engine. |
| **Web Search Agent** | DuckDuckGo search library runs live real-time web searches with zero API keys or quotas. |
| **Vision Agent** | Local Pillow library inspects resolution, aspect ratio, palettes, and converts UI mockups to React Tailwind code with zero keys. |
| **Image Generation** | High-definition FLUX.1 & SDXL models render free unlimited images with styles and custom aspect ratios without API keys. |
| **RAG Knowledge Base** | In-memory semantic vector chunking with TF-IDF cosine similarity indexing. No external vector databases or keys. |
| **Job Agent Suite** | RemoteOK live API + DuckDuckGo live job aggregator + ATS matching and Star bullet points re-writing with zero keys. |
| **Voice Agent** | Web Speech API in the browser provides speech-to-text and natural neural text-to-speech with zero keys. |
| **Email & Calendar** | Instant `mailto:` links and standard RFC 5545 `.ics` downloads created locally with zero keys. |

*(Optional)*: If you ever want to connect your own private keys (Groq, Gemini, OpenRouter, or local Ollama), you can easily plug them in via Settings, but **NEXORA is 100% fully functional without any keys at all!**

