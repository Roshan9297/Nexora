import json
import os
import httpx
from typing import List, Dict, Any, Optional
from duckduckgo_search import DDGS
from .llm_client import LLMClient

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "job_applications.json")

class JobAgent:
    """
    Comprehensive Job Agent Suite:
    1. Find Jobs (RemoteOK live API + DuckDuckGo job aggregator)
    2. Match Jobs to Resume (ATS scoring & keyword gap analysis)
    3. Tailor Resume (Targeted resume re-writer)
    4. Generate Cover Letter (Personalized cover letter)
    5. Fill Applications (Application form answers generator)
    6. Track Applications (CRUD Kanban database)
    7. Interview Preparation (Interactive AI mock interviewer)
    """

    @staticmethod
    async def find_jobs(query: str = "Software Engineer", location: str = "Remote") -> List[Dict[str, Any]]:
        jobs = []

        # 1. Try RemoteOK free public API
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get("https://remoteok.com/api", headers=headers)
                if r.status_code == 200:
                    data = r.json()
                    # Skip first legal disclaimer element if present
                    items = [d for d in data if isinstance(d, dict) and d.get("position")]
                    query_lower = query.lower()
                    for item in items[:25]:
                        pos = item.get("position", "")
                        desc = item.get("description", "")
                        tags = " ".join(item.get("tags", []))
                        if query_lower in pos.lower() or query_lower in tags.lower() or query_lower in desc.lower():
                            jobs.append({
                                "id": str(item.get("id", "")),
                                "title": pos,
                                "company": item.get("company", "Tech Company"),
                                "location": item.get("location") or "Remote",
                                "salary": item.get("salary") or "Competitive",
                                "tags": item.get("tags", [])[:5],
                                "url": item.get("url", f"https://remoteok.com/l/{item.get('id')}"),
                                "source": "RemoteOK"
                            })
        except Exception:
            pass

        # 2. Add Live DuckDuckGo Job Postings
        try:
            with DDGS() as ddgs:
                ddg_q = f"{query} jobs {location} hire site:linkedin.com/jobs OR site:greenhouse.io OR site:lever.co OR site:indeed.com"
                results = ddgs.text(ddg_q, max_results=6)
                for r in results:
                    jobs.append({
                        "id": str(abs(hash(r.get("href", "")))),
                        "title": r.get("title", f"{query} Position"),
                        "company": "Live Job Listing",
                        "location": location,
                        "salary": "See job post",
                        "tags": [query, "Direct Apply"],
                        "url": r.get("href", ""),
                        "source": "Web Aggregator"
                    })
        except Exception:
            pass

        # Fallback if empty
        if not jobs:
            jobs = [
                {
                    "id": "101",
                    "title": f"Senior {query}",
                    "company": "Nexora Global Tech",
                    "location": "Remote (Worldwide)",
                    "salary": "$120,000 - $160,000",
                    "tags": ["Full-Time", "Remote", "Engineering"],
                    "url": "https://careers.google.com",
                    "source": "Featured"
                },
                {
                    "id": "102",
                    "title": f"Lead {query} Architect",
                    "company": "Quantum Dynamics",
                    "location": "Remote / Hybrid",
                    "salary": "$140,000 - $190,000",
                    "tags": ["Tech", "Cloud", "Architecture"],
                    "url": "https://remoteok.com",
                    "source": "Featured"
                }
            ]

        return jobs

    @staticmethod
    async def match_resume_to_job(
        resume_text: str,
        job_description: str,
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> str:
        prompt = (
            "You are NEXORA ATS & Talent Recruitment Agent.\n"
            "Analyze the candidate's resume against the target job description.\n\n"
            "Provide an ATS evaluation with:\n"
            "1. **Match Score**: (e.g. 85/100) with a brief justification\n"
            "2. **Matching Strengths & Skills**: Key requirements from the job description clearly demonstrated in the resume\n"
            "3. **Critical Skill Gaps & Missing Keywords**: Key terms/skills requested that are absent or weak in the resume\n"
            "4. **ATS Formatting & Action Verb Recommendations**: Specific bullet point changes to increase interview callback rate\n"
            "5. **Final Verdict**: (Strong Match / Moderate Match / Needs Tailoring)\n\n"
            f"Candidate Resume:\n{resume_text[:15000]}\n\n"
            f"Target Job Description:\n{job_description[:15000]}"
        )

        messages = [
            {"role": "system", "content": "You are NEXORA Career & ATS Match Specialist."},
            {"role": "user", "content": prompt}
        ]

        return await LLMClient.chat_complete(messages=messages, provider=provider, model=model, api_key=api_key)

    @staticmethod
    async def tailor_resume(
        resume_text: str,
        job_description: str,
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> str:
        prompt = (
            "You are NEXORA Resume Optimizer.\n"
            "Rewrite and optimize the candidate's resume to specifically target the provided job description.\n"
            "Guidelines:\n"
            "- Craft a punchy, targeted Professional Summary.\n"
            "- Rephrase work experience bullet points using high-impact action verbs and quantified metrics (STAR method: Situation, Task, Action, Result).\n"
            "- Naturally incorporate missing keywords from the job description.\n"
            "- Output the complete tailored resume in clean, professional Markdown format ready to be exported to PDF.\n\n"
            f"Original Resume:\n{resume_text[:15000]}\n\n"
            f"Job Description:\n{job_description[:15000]}"
        )

        messages = [
            {"role": "system", "content": "You are NEXORA Executive Resume Writer."},
            {"role": "user", "content": prompt}
        ]

        return await LLMClient.chat_complete(messages=messages, provider=provider, model=model, api_key=api_key)

    @staticmethod
    async def generate_cover_letter(
        resume_text: str,
        job_description: str,
        company_name: str = "Hiring Team",
        tone: str = "confident and professional",
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> str:
        prompt = (
            f"You are NEXORA Cover Letter Specialist.\n"
            f"Write a compelling, bespoke cover letter for a position at '{company_name}'.\n"
            f"Tone: {tone}.\n"
            "The cover letter must:\n"
            "- Hook the reader immediately with genuine excitement for the role and company.\n"
            "- Highlight 2-3 standout achievements from the resume directly relevant to the job requirements.\n"
            "- Address how the candidate will solve the company's problems and deliver value.\n"
            "- Close with a clear, polite call to action for an interview.\n\n"
            f"Candidate Resume:\n{resume_text[:12000]}\n\n"
            f"Job Description:\n{job_description[:12000]}"
        )

        messages = [
            {"role": "system", "content": "You are NEXORA Cover Letter Specialist."},
            {"role": "user", "content": prompt}
        ]

        return await LLMClient.chat_complete(messages=messages, provider=provider, model=model, api_key=api_key)

    @staticmethod
    async def fill_applications(
        resume_text: str,
        questions: List[str],
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> str:
        q_list = "\n".join([f"{idx+1}. {q}" for idx, q in enumerate(questions)])
        prompt = (
            "You are NEXORA Job Application Autofill Assistant.\n"
            "Draft high-scoring, concise, and professional answers for each of the following job application screening questions, "
            "grounded in the candidate's actual background and achievements:\n\n"
            f"Questions:\n{q_list}\n\n"
            f"Candidate Resume / Background:\n{resume_text[:12000]}"
        )

        messages = [
            {"role": "system", "content": "You are NEXORA Job Application Assistant."},
            {"role": "user", "content": prompt}
        ]

        return await LLMClient.chat_complete(messages=messages, provider=provider, model=model, api_key=api_key)

    @staticmethod
    def get_applications() -> List[Dict[str, Any]]:
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        if not os.path.exists(DATA_FILE):
            # Seed with sample data
            default_apps = [
                {
                    "id": "app-1",
                    "company": "Stripe",
                    "position": "Senior Full-Stack Engineer",
                    "status": "Interviewing",
                    "date": "2026-09-15",
                    "notes": "Technical screen scheduled. Practice system design.",
                    "salary": "$180,000",
                    "url": "https://stripe.com/jobs"
                },
                {
                    "id": "app-2",
                    "company": "Vercel",
                    "position": "Next.js AI Platform Specialist",
                    "status": "Applied",
                    "date": "2026-09-17",
                    "notes": "Submitted tailored resume and custom cover letter.",
                    "salary": "$175,000",
                    "url": "https://vercel.com/careers"
                }
            ]
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(default_apps, f, indent=2)
            return default_apps

        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @staticmethod
    def save_applications(apps: List[Dict[str, Any]]):
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(apps, f, indent=2)

    @staticmethod
    async def interview_prep(
        role: str,
        category: str = "technical",
        resume_summary: Optional[str] = None,
        candidate_answer: Optional[str] = None,
        question: Optional[str] = None,
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> str:
        if candidate_answer and question:
            prompt = (
                f"You are NEXORA Mock Interview Coach evaluating a candidate for the role: '{role}'.\n\n"
                f"Interview Question Asked: {question}\n"
                f"Candidate's Answer:\n{candidate_answer}\n\n"
                "Evaluate the candidate's answer:\n"
                "1. **Score**: (out of 10) with detailed evaluation\n"
                "2. **Strengths**: What was communicated clearly and effectively\n"
                "3. **Weaknesses & Blindspots**: What was missing or vague\n"
                "4. **Model Answer**: An exemplary, senior-level response to this exact question"
            )
        else:
            prompt = (
                f"You are NEXORA Mock Interview Coach preparing a candidate for the role: '{role}'.\n"
                f"Question Category: {category} (e.g. behavioral, system design, technical coding, cultural fit).\n"
                f"Candidate Background: {resume_summary or 'General Tech Professional'}\n\n"
                "Generate 5 realistic, challenging, high-frequency interview questions with tips on what interviewers look for."
            )

        messages = [
            {"role": "system", "content": "You are NEXORA Senior Interview Coach."},
            {"role": "user", "content": prompt}
        ]

        return await LLMClient.chat_complete(messages=messages, provider=provider, model=model, api_key=api_key)
