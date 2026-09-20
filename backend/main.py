import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

# Import agents
from agents.llm_client import LLMClient
from agents.search_agent import SearchAgent
from agents.doc_agent import DocumentAgent
from agents.coding_agent import CodingAgent
from agents.reasoning_agent import ReasoningAgent
from agents.vision_agent import VisionAgent
from agents.image_gen_agent import ImageGenAgent
from agents.rag_agent import RAGAgent
from agents.browser_agent import BrowserAgent
from agents.job_agent import JobAgent
from agents.email_agent import EmailAgent
from agents.calendar_agent import CalendarAgent
from agents.automation_agent import AutomationAgent

app = FastAPI(
    title="NEXORA AI Backend API",
    description="Autonomous Multi-Agent AI System - 100% Subscription-Free Alternative",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Proprietary Copyright Protection Middleware
@app.middleware("http")
async def add_security_and_copyright_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Copyright"] = "Copyright (c) 2026 NEXORA AI Inc. All Rights Reserved."
    response.headers["X-License-Type"] = "Proprietary - Confidential & Private Server"
    response.headers["X-Access-Policy"] = "Restricted - Authenticated Clients Only"
    return response

# Health Check
@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "system": "NEXORA AI",
        "version": "1.0.0",
        "copyright": "© 2026 NEXORA AI Inc. All Rights Reserved. Proprietary & Confidential.",
        "server_type": "Private Restricted Node",
        "free_tier_ready": True,
        "default_providers": ["pollinations", "groq", "gemini", "ollama", "lmstudio", "openrouter"]
    }

# Autonomous Daily Auto-Applier Background Daemon
async def daily_auto_applier_daemon():
    """Runs once every 24 hours in the background if enabled in candidate profile."""
    # Give server 15 seconds to boot up before initial check
    await asyncio.sleep(15)
    while True:
        try:
            profile = JobAgent.get_candidate_profile()
            if profile.get("auto_apply_enabled", True):
                print("[NEXORA DAEMON] Running scheduled daily auto-application & JD tailoring cycle...")
                await JobAgent.run_daily_auto_apply_cycle(provider="pollinations", force=False)
        except Exception as e:
            print(f"[NEXORA DAEMON] Auto-apply cycle encountered error: {e}")
        # Sleep 24 hours (86400 seconds)
        await asyncio.sleep(86400)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(daily_auto_applier_daemon())

# 1. Chat & Reasoning Stream Endpoint (SSE)
class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    temperature: Optional[float] = 0.7
    reasoning_mode: Optional[bool] = False

@app.post("/api/chat/stream")
async def chat_stream_endpoint(req: ChatRequest):
    async def event_generator():
        if req.reasoning_mode:
            streamer = ReasoningAgent.stream_reasoning(
                messages=req.messages,
                provider=req.provider,
                model=req.model,
                api_key=req.api_key
            )
        else:
            streamer = LLMClient.chat_stream(
                messages=req.messages,
                provider=req.provider,
                model=req.model,
                api_key=req.api_key,
                base_url=req.base_url,
                temperature=req.temperature or 0.7
            )

        try:
            async for token in streamer:
                # SSE data packet
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            err_data = json.dumps({"error": str(e)})
            yield f"data: {err_data}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# 2. Live Web Search Agent
class SearchRequest(BaseModel):
    query: str
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/search")
async def search_endpoint(req: SearchRequest):
    try:
        data = await SearchAgent.answer_with_search(
            query=req.query,
            provider=req.provider,
            model=req.model,
            api_key=req.api_key
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. Document Agent: Upload & Parse
@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    content_bytes = await file.read()
    filename = file.filename or "uploaded_file"
    try:
        extracted_text = DocumentAgent.extract_text_from_bytes(content_bytes, filename)
        return {
            "filename": filename,
            "char_count": len(extracted_text),
            "word_count": len(extracted_text.split()),
            "preview": extracted_text[:1000],
            "text": extracted_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

class DocAnalyzeRequest(BaseModel):
    text: str
    filename: str
    task: Optional[str] = "summary"
    question: Optional[str] = None
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/documents/analyze")
async def analyze_document_endpoint(req: DocAnalyzeRequest):
    return await DocumentAgent.analyze_document(
        text=req.text,
        filename=req.filename,
        task=req.task or "summary",
        question=req.question,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )

# 4. Coding Agent: Execution & Analysis
class CodeExecuteRequest(BaseModel):
    language: str
    code: str

@app.post("/api/coding/execute")
async def execute_code_endpoint(req: CodeExecuteRequest):
    return CodingAgent.execute_code(language=req.language, code=req.code)

class CodeAnalyzeRequest(BaseModel):
    code: str
    language: Optional[str] = "python"
    task: Optional[str] = "review"
    instruction: Optional[str] = None
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/coding/analyze")
async def analyze_code_endpoint(req: CodeAnalyzeRequest):
    analysis = await CodingAgent.analyze_code(
        code=req.code,
        task=req.task or "review",
        language=req.language or "python",
        instruction=req.instruction,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )
    return {"analysis": analysis}

# 5. Image Generation Agent (Pollinations / Flux - 100% Free)
class ImageGenRequest(BaseModel):
    prompt: str
    style: Optional[str] = "photorealistic"
    aspect_ratio: Optional[str] = "1:1"
    model: Optional[str] = "flux"
    seed: Optional[int] = None

@app.post("/api/image/generate")
async def generate_image_endpoint(req: ImageGenRequest):
    return ImageGenAgent.generate_image_url(
        prompt=req.prompt,
        style=req.style,
        aspect_ratio=req.aspect_ratio or "1:1",
        model=req.model or "flux",
        seed=req.seed
    )

# 6. Vision Agent
class VisionRequest(BaseModel):
    image_base64: str
    mime_type: Optional[str] = "image/jpeg"
    prompt: Optional[str] = "Describe and inspect this image."
    provider: Optional[str] = "gemini"
    api_key: Optional[str] = None

@app.post("/api/vision/analyze")
async def vision_endpoint(req: VisionRequest):
    return await VisionAgent.analyze_image(
        image_base64=req.image_base64,
        mime_type=req.mime_type or "image/jpeg",
        prompt=req.prompt or "Describe this image",
        provider=req.provider or "gemini",
        api_key=req.api_key
    )

# 7. RAG / Knowledge Base Agent
class RAGIngestRequest(BaseModel):
    collection: str
    doc_id: str
    title: str
    content: str

@app.post("/api/rag/ingest")
async def rag_ingest_endpoint(req: RAGIngestRequest):
    RAGAgent.add_document(
        collection=req.collection,
        doc_id=req.doc_id,
        title=req.title,
        content=req.content
    )
    return {"success": True, "message": f"Document '{req.title}' ingested into collection '{req.collection}'."}

class RAGQueryRequest(BaseModel):
    collection: str
    query: str
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/rag/query")
async def rag_query_endpoint(req: RAGQueryRequest):
    return await RAGAgent.query_knowledge_base(
        collection=req.collection,
        query=req.query,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )

# 8. Browser Agent
class BrowserRequest(BaseModel):
    url: str
    question: Optional[str] = None
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/browser/browse")
async def browser_endpoint(req: BrowserRequest):
    return await BrowserAgent.browse_and_analyze(
        url=req.url,
        question=req.question,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )

# 9. Job Agent Suite
class JobSearchRequest(BaseModel):
    query: Optional[str] = "Software Engineer"
    location: Optional[str] = "Remote"

@app.post("/api/jobs/search")
async def job_search_endpoint(req: JobSearchRequest):
    jobs = await JobAgent.find_jobs(query=req.query or "Software Engineer", location=req.location or "Remote")
    return {"jobs": jobs}

class ResumeMatchRequest(BaseModel):
    resume_text: str
    job_description: str
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/jobs/match")
async def job_match_endpoint(req: ResumeMatchRequest):
    analysis = await JobAgent.match_resume_to_job(
        resume_text=req.resume_text,
        job_description=req.job_description,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )
    return {"analysis": analysis}

@app.post("/api/jobs/tailor")
async def job_tailor_endpoint(req: ResumeMatchRequest):
    tailored = await JobAgent.tailor_resume(
        resume_text=req.resume_text,
        job_description=req.job_description,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )
    return {"tailored_resume": tailored}

class CoverLetterRequest(BaseModel):
    resume_text: str
    job_description: str
    company_name: Optional[str] = "Hiring Team"
    tone: Optional[str] = "confident and professional"
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/jobs/cover-letter")
async def cover_letter_endpoint(req: CoverLetterRequest):
    letter = await JobAgent.generate_cover_letter(
        resume_text=req.resume_text,
        job_description=req.job_description,
        company_name=req.company_name or "Hiring Team",
        tone=req.tone or "confident and professional",
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )
    return {"cover_letter": letter}

class FillAppRequest(BaseModel):
    resume_text: str
    questions: List[str]
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/jobs/fill-applications")
async def fill_applications_endpoint(req: FillAppRequest):
    answers = await JobAgent.fill_applications(
        resume_text=req.resume_text,
        questions=req.questions,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )
    return {"answers": answers}

@app.get("/api/jobs/tracker")
async def get_applications_endpoint():
    return {"applications": JobAgent.get_applications()}

@app.post("/api/jobs/tracker")
async def save_applications_endpoint(apps: List[Dict[str, Any]]):
    JobAgent.save_applications(apps)
    return {"success": True, "count": len(apps)}

class InterviewPrepRequest(BaseModel):
    role: str
    category: Optional[str] = "technical"
    resume_summary: Optional[str] = None
    candidate_answer: Optional[str] = None
    question: Optional[str] = None
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/jobs/interview-prep")
async def interview_prep_endpoint(req: InterviewPrepRequest):
    prep = await JobAgent.interview_prep(
        role=req.role,
        category=req.category or "technical",
        resume_summary=req.resume_summary,
        candidate_answer=req.candidate_answer,
        question=req.question,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )
    return {"result": prep}

# Auto-Applier Suite (Daily Autonomous JD Tailoring & Application Dispatch)
@app.get("/api/jobs/auto-apply/profile")
async def get_candidate_profile_endpoint():
    return JobAgent.get_candidate_profile()

@app.post("/api/jobs/auto-apply/profile")
async def save_candidate_profile_endpoint(profile: Dict[str, Any]):
    saved = JobAgent.save_candidate_profile(profile)
    return {"success": True, "profile": saved}

@app.get("/api/jobs/auto-apply/logs")
async def get_auto_apply_logs_endpoint():
    return {"logs": JobAgent.get_auto_apply_logs()}

class AutoApplyTriggerRequest(BaseModel):
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None
    force: Optional[bool] = True

@app.post("/api/jobs/auto-apply/trigger")
async def trigger_auto_apply_endpoint(req: AutoApplyTriggerRequest):
    result = await JobAgent.run_daily_auto_apply_cycle(
        provider=req.provider or "pollinations",
        model=req.model,
        api_key=req.api_key,
        force=req.force if req.force is not None else True
    )
    return result

# 10. Email Agent
class EmailRequest(BaseModel):
    recipient: str
    goal: str
    context: Optional[str] = None
    tone: Optional[str] = "professional and concise"
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/email/compose")
async def email_compose_endpoint(req: EmailRequest):
    return await EmailAgent.compose_email(
        recipient=req.recipient,
        goal=req.goal,
        context=req.context,
        tone=req.tone or "professional",
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )

# 11. Calendar Agent
class CalendarRequest(BaseModel):
    prompt: str
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/calendar/event")
async def calendar_event_endpoint(req: CalendarRequest):
    return await CalendarAgent.parse_event(
        prompt=req.prompt,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )

# 12. Automation Agent
class AutomationRequest(BaseModel):
    pipeline_type: str
    parameters: Dict[str, Any]
    provider: Optional[str] = "pollinations"
    model: Optional[str] = None
    api_key: Optional[str] = None

@app.post("/api/automation/run")
async def automation_run_endpoint(req: AutomationRequest):
    return await AutomationAgent.run_pipeline(
        pipeline_type=req.pipeline_type,
        parameters=req.parameters,
        provider=req.provider,
        model=req.model,
        api_key=req.api_key
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
