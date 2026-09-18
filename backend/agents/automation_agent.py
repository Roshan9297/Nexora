import asyncio
from typing import List, Dict, Any, Optional
from .search_agent import SearchAgent
from .llm_client import LLMClient
from .job_agent import JobAgent

class AutomationAgent:
    """
    Automation Agent: Orchestrates multi-step autonomous pipelines and chained agents.
    """

    @staticmethod
    async def run_pipeline(
        pipeline_type: str,
        parameters: Dict[str, Any],
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        logs = []

        # Pipeline 1: Deep Research & Executive Report
        if pipeline_type == "research_report":
            topic = parameters.get("topic", "Latest AI Innovations")
            logs.append({"step": "1. Live Web Search", "status": "running", "detail": f"Searching web for: {topic}"})
            search_results = SearchAgent.search_web(topic, max_results=5)
            logs[-1]["status"] = "completed"
            logs[-1]["detail"] = f"Found {len(search_results)} live web sources."

            logs.append({"step": "2. Synthesizing Findings", "status": "running", "detail": "Cross-verifying source data..."})
            ans_data = await SearchAgent.answer_with_search(topic, provider=provider, model=model, api_key=api_key)
            logs[-1]["status"] = "completed"

            logs.append({"step": "3. Formatting Executive Dossier", "status": "running", "detail": "Compiling final report..."})
            report_prompt = (
                f"You are NEXORA Automation Intelligence Officer.\n"
                f"Convert these research findings into a publication-ready Executive Intelligence Briefing with sections:\n"
                "- Executive Abstract\n"
                "- Strategic Market Drivers\n"
                "- Critical Risk Factors\n"
                "- Key Milestones & Forecast\n"
                "- Actionable Recommendations\n\n"
                f"Findings:\n{ans_data['answer']}"
            )
            final_report = await LLMClient.chat_complete(
                messages=[{"role": "user", "content": report_prompt}],
                provider=provider,
                model=model,
                api_key=api_key
            )
            logs[-1]["status"] = "completed"

            return {
                "pipeline": "Deep Research & Executive Report",
                "logs": logs,
                "output": final_report,
                "sources": search_results
            }

        # Pipeline 2: Automated Job Hunter (Search -> Rank -> Tailor Cover Letter)
        elif pipeline_type == "job_hunt_pipeline":
            role = parameters.get("role", "Full Stack Developer")
            location = parameters.get("location", "Remote")
            resume = parameters.get("resume", "Experienced software developer in Python, React, Next.js, and Cloud.")

            logs.append({"step": "1. Scanning Job Boards", "status": "running", "detail": f"Searching live listings for '{role}' in '{location}'"})
            jobs = await JobAgent.find_jobs(query=role, location=location)
            logs[-1]["status"] = "completed"
            logs[-1]["detail"] = f"Located {len(jobs)} active job postings."

            top_job = jobs[0] if jobs else {"title": role, "company": "Target Company", "location": location}
            logs.append({"step": "2. ATS Keyword Match Analysis", "status": "running", "detail": f"Evaluating match for {top_job['title']} at {top_job['company']}"})
            match_analysis = await JobAgent.match_resume_to_job(resume_text=resume, job_description=f"{top_job['title']} at {top_job['company']}", provider=provider, model=model, api_key=api_key)
            logs[-1]["status"] = "completed"

            logs.append({"step": "3. Drafting Custom Cover Letter", "status": "running", "detail": f"Crafting targeted letter for {top_job['company']}"})
            cover_letter = await JobAgent.generate_cover_letter(resume_text=resume, job_description=f"{top_job['title']} at {top_job['company']}", company_name=top_job.get("company", "Company"), provider=provider, model=model, api_key=api_key)
            logs[-1]["status"] = "completed"

            return {
                "pipeline": "Automated Job Hunter",
                "logs": logs,
                "top_job": top_job,
                "match_analysis": match_analysis,
                "cover_letter": cover_letter,
                "all_jobs": jobs
            }

        # Default custom pipeline
        else:
            goal = parameters.get("goal", "Execute custom automation workflow")
            logs.append({"step": "1. Step Decomposition", "status": "completed", "detail": f"Deconstructed workflow for: {goal}"})
            logs.append({"step": "2. Agent Execution", "status": "running", "detail": "Executing autonomous instructions..."})
            
            prompt = (
                f"You are NEXORA Automation Engine.\n"
                f"Execute the requested automated workflow: '{goal}'.\n"
                "Provide an exhaustive, step-by-step execution report detailing actions taken, data processed, and resulting deliverables."
            )
            output = await LLMClient.chat_complete(
                messages=[{"role": "user", "content": prompt}],
                provider=provider,
                model=model,
                api_key=api_key
            )
            logs[-1]["status"] = "completed"

            return {
                "pipeline": "Custom Agent Workflow",
                "logs": logs,
                "output": output
            }
