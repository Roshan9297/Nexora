import urllib.parse
from typing import Dict, Any, Optional
from .llm_client import LLMClient

class EmailAgent:
    """
    Email Agent for composing, refining, and generating one-click mailto links.
    """

    @staticmethod
    async def compose_email(
        recipient: str,
        goal: str,
        context: Optional[str] = None,
        tone: str = "professional and concise",
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        prompt = (
            f"You are NEXORA Email Agent.\n"
            f"Recipient: {recipient}\n"
            f"Goal: {goal}\n"
            f"Tone: {tone}\n"
            f"Additional Context: {context or 'None'}\n\n"
            "Generate:\n"
            "1. Three alternative Subject Line options (High Open Rate)\n"
            "2. Polished Email Body\n"
            "Format your response as:\n"
            "SUBJECT_1: ...\n"
            "SUBJECT_2: ...\n"
            "SUBJECT_3: ...\n"
            "---BODY---\n"
            "[Email body here]"
        )

        messages = [
            {"role": "system", "content": "You are NEXORA Executive Communication & Email Specialist."},
            {"role": "user", "content": prompt}
        ]

        raw_output = await LLMClient.chat_complete(
            messages=messages,
            provider=provider,
            model=model,
            api_key=api_key
        )

        # Parse subject lines & body
        subjects = []
        body = raw_output
        if "---BODY---" in raw_output:
            parts = raw_output.split("---BODY---")
            top_section = parts[0]
            body = parts[1].strip()
            for line in top_section.splitlines():
                if "SUBJECT" in line and ":" in line:
                    subj = line.split(":", 1)[1].strip()
                    if subj:
                        subjects.append(subj)

        if not subjects:
            subjects = [f"Regarding {goal[:40]}", f"Update: {goal[:40]}"]

        selected_subject = subjects[0]
        mailto_url = f"mailto:{urllib.parse.quote(recipient)}?subject={urllib.parse.quote(selected_subject)}&body={urllib.parse.quote(body)}"

        return {
            "recipient": recipient,
            "subjects": subjects,
            "body": body,
            "mailto_url": mailto_url,
            "raw": raw_output
        }
