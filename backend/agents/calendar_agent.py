import urllib.parse
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from .llm_client import LLMClient

class CalendarAgent:
    """
    Calendar Agent: Parses natural language scheduling requests,
    generates .ics iCalendar files and one-click Google Calendar links.
    """

    @staticmethod
    async def parse_event(
        prompt: str,
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

        system_prompt = (
            f"You are NEXORA Calendar Agent. The current date and time is: {now_iso}.\n"
            "Extract or calculate event details from the user's natural language request.\n"
            "Respond ONLY with a valid JSON object with these exact keys:\n"
            "{\n"
            '  "title": "Title of the event",\n'
            '  "description": "Short description",\n'
            '  "location": "Location or Video link (e.g. Google Meet)",\n'
            '  "start_time": "YYYYMMDDTHHMMSSZ",\n'
            '  "end_time": "YYYYMMDDTHHMMSSZ",\n'
            '  "summary_text": "Human readable summary of the scheduled event"\n'
            "}\n"
            "Ensure start_time and end_time are formatted strictly as basic ISO 8601 strings (e.g. 20260919T100000Z). No markdown code blocks."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        raw = await LLMClient.chat_complete(messages=messages, provider=provider, model=model, api_key=api_key)

        # Parse JSON
        clean_json = raw.strip()
        if "```" in clean_json:
            clean_json = clean_json.split("```")[1]
            if clean_json.startswith("json"):
                clean_json = clean_json[4:]
            clean_json = clean_json.strip()

        try:
            event_data = json.loads(clean_json)
        except Exception:
            start_dt = datetime.now() + timedelta(days=1)
            end_dt = start_dt + timedelta(hours=1)
            event_data = {
                "title": prompt[:30],
                "description": prompt,
                "location": "Online / Nexora AI",
                "start_time": start_dt.strftime("%Y%m%dT%H%M%SZ"),
                "end_time": end_dt.strftime("%Y%m%dT%H%M%SZ"),
                "summary_text": f"Event scheduled: {prompt}"
            }

        # Build .ics content
        ics_content = (
            "BEGIN:VCALENDAR\r\n"
            "VERSION:2.0\r\n"
            "PRODID:-//NEXORA AI//Calendar Agent//EN\r\n"
            "BEGIN:VEVENT\r\n"
            f"UID:nexora-{datetime.now().timestamp()}@nexora.ai\r\n"
            f"DTSTAMP:{datetime.now().strftime('%Y%m%dT%H%M%SZ')}\r\n"
            f"DTSTART:{event_data.get('start_time')}\r\n"
            f"DTEND:{event_data.get('end_time')}\r\n"
            f"SUMMARY:{event_data.get('title')}\r\n"
            f"DESCRIPTION:{event_data.get('description')}\r\n"
            f"LOCATION:{event_data.get('location')}\r\n"
            "STATUS:CONFIRMED\r\n"
            "END:VEVENT\r\n"
            "END:VCALENDAR\r\n"
        )

        # Build Google Calendar direct URL
        gcal_params = {
            "action": "TEMPLATE",
            "text": event_data.get("title", "Event"),
            "dates": f"{event_data.get('start_time')}/{event_data.get('end_time')}",
            "details": event_data.get("description", ""),
            "location": event_data.get("location", "")
        }
        gcal_url = f"https://calendar.google.com/calendar/render?{urllib.parse.urlencode(gcal_params)}"

        return {
            "event": event_data,
            "ics_content": ics_content,
            "gcal_url": gcal_url
        }
