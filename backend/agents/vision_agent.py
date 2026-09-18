import httpx
from typing import Dict, Any, Optional

class VisionAgent:
    """
    Multimodal Vision Agent for analyzing images, diagrams, screenshots, and OCR.
    Supports free Google Gemini API, Groq Vision, or fallback.
    """

    @staticmethod
    async def analyze_image(
        image_base64: str,
        mime_type: str = "image/jpeg",
        prompt: str = "Describe and analyze this image in detail.",
        provider: str = "gemini",
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Google Gemini Multimodal (Free tier)
        if provider == "gemini" and api_key:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
            clean_b64 = image_base64.split(",")[-1] if "," in image_base64 else image_base64
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": clean_b64
                                }
                            }
                        ]
                    }
                ]
            }
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(endpoint, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {"success": True, "analysis": text, "provider": "gemini"}
                    else:
                        return {"success": False, "error": f"Gemini Error {resp.status_code}: {resp.text}"}
            except Exception as e:
                return {"success": False, "error": str(e)}

        # 2. Groq Vision (Llama 3.2 Vision)
        elif provider == "groq" and api_key:
            endpoint = "https://api.groq.com/openai/v1/chat/completions"
            image_url = f"data:{mime_type};base64,{image_base64.split(',')[-1] if ',' in image_base64 else image_base64}"
            payload = {
                "model": "llama-3.2-11b-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_url}}
                        ]
                    }
                ]
            }
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(endpoint, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["choices"][0]["message"]["content"]
                        return {"success": True, "analysis": text, "provider": "groq"}
                    else:
                        return {"success": False, "error": f"Groq Error: {resp.text}"}
            except Exception as e:
                return {"success": False, "error": str(e)}

        # 3. Informative fallback for zero-subscription users
        return {
            "success": True,
            "analysis": (
                "**Vision Analysis:**\n\n"
                f"Image received ({mime_type}). To enable real-time neural vision recognition (diagram-to-code, OCR, object detection), "
                "please provide a free Google Gemini or Groq API key in **Settings** (both provide free tier access with no credit card required)."
            ),
            "provider": "info"
        }
