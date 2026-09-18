import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional

class LLMClient:
    """
    Unified LLM Client supporting zero-subscription operations:
    - Free Cloud Providers: Groq, Gemini, OpenRouter free models
    - Free Fallback: Pollinations.ai (no key required!)
    - Local Engines: Ollama (http://localhost:11434), LM Studio (http://localhost:1234)
    """

    @staticmethod
    async def chat_complete(
        messages: List[Dict[str, str]],
        provider: str = "pollinations",
        model: str = "default",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> str:
        async for chunk in LLMClient.chat_stream(messages, provider, model, api_key, base_url, temperature, max_tokens):
            pass
        # or non-streaming aggregate
        chunks = []
        async for chunk in LLMClient.chat_stream(messages, provider, model, api_key, base_url, temperature, max_tokens):
            chunks.append(chunk)
        return "".join(chunks)

    @staticmethod
    async def chat_stream(
        messages: List[Dict[str, str]],
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096
    ) -> AsyncGenerator[str, None]:
        provider = (provider or "pollinations").lower()

        # 1. Groq (Free fast inference)
        if provider == "groq":
            if not api_key:
                # If no key, fallback gracefully to Pollinations with informative note
                yield "[Note: No Groq API Key found. Connecting via Free Fallback Engine...]\n\n"
                async for chunk in LLMClient._stream_pollinations(messages, model="openai", temperature=temperature):
                    yield chunk
                return

            endpoint = "https://api.groq.com/openai/v1/chat/completions"
            selected_model = model or "llama-3.3-70b-versatile"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": selected_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True
            }
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", endpoint, headers=headers, json=payload) as response:
                        if response.status_code != 200:
                            err = await response.aread()
                            yield f"\n[Groq Error {response.status_code}: {err.decode('utf-8', errors='ignore')}]"
                            return
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data_json = json.loads(data_str)
                                    delta = data_json["choices"][0].get("delta", {})
                                    if "content" in delta and delta["content"]:
                                        yield delta["content"]
                                except Exception:
                                    continue
            except Exception as e:
                yield f"\n[Groq Connection Error: {str(e)}. Falling back to Free Engine...]\n\n"
                async for chunk in LLMClient._stream_pollinations(messages):
                    yield chunk
            return

        # 2. Google Gemini Free Tier
        elif provider == "gemini":
            if not api_key:
                yield "[Note: No Gemini API Key found. Connecting via Free Fallback Engine...]\n\n"
                async for chunk in LLMClient._stream_pollinations(messages, model="gemini", temperature=temperature):
                    yield chunk
                return

            gemini_model = model or "gemini-2.0-flash"
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:streamGenerateContent?alt=sse&key={api_key}"

            # Convert standard OpenAI messages to Gemini format
            contents = []
            system_instruction = None
            for m in messages:
                role = m.get("role", "user")
                content = m.get("content", "")
                if role == "system":
                    system_instruction = {"parts": [{"text": content}]}
                elif role == "assistant":
                    contents.append({"role": "model", "parts": [{"text": content}]})
                else:
                    contents.append({"role": "user", "parts": [{"text": content}]})

            payload: Dict[str, Any] = {
                "contents": contents,
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens
                }
            }
            if system_instruction:
                payload["systemInstruction"] = system_instruction

            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", endpoint, json=payload) as response:
                        if response.status_code != 200:
                            err = await response.aread()
                            yield f"\n[Gemini Error {response.status_code}: {err.decode('utf-8', errors='ignore')}]"
                            return
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                try:
                                    data_json = json.loads(data_str)
                                    candidates = data_json.get("candidates", [])
                                    if candidates:
                                        parts = candidates[0].get("content", {}).get("parts", [])
                                        for part in parts:
                                            if "text" in part:
                                                yield part["text"]
                                except Exception:
                                    continue
            except Exception as e:
                yield f"\n[Gemini Error: {str(e)}]"
            return

        # 3. Local Ollama (100% Free & Offline)
        elif provider == "ollama":
            ollama_url = base_url or "http://localhost:11434"
            endpoint = f"{ollama_url.rstrip('/')}/api/chat"
            selected_model = model or "llama3.2"
            payload = {
                "model": selected_model,
                "messages": messages,
                "stream": True,
                "options": {
                    "temperature": temperature
                }
            }
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    async with client.stream("POST", endpoint, json=payload) as response:
                        if response.status_code != 200:
                            yield f"\n[Ollama Error {response.status_code}: Make sure Ollama is running at {ollama_url}]"
                            return
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    data_json = json.loads(line)
                                    msg = data_json.get("message", {})
                                    if "content" in msg and msg["content"]:
                                        yield msg["content"]
                                except Exception:
                                    continue
            except Exception as e:
                yield f"\n[Ollama Connection Error: {str(e)}. Ensure Ollama is installed and running (`ollama serve`).]"
            return

        # 4. Local LM Studio / vLLM / OpenAI-compatible
        elif provider in ("lmstudio", "local", "custom"):
            url = base_url or "http://localhost:1234/v1"
            endpoint = f"{url.rstrip('/')}/chat/completions"
            selected_model = model or "local-model"
            headers = {
                "Authorization": f"Bearer {api_key or 'not-needed'}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": selected_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True
            }
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    async with client.stream("POST", endpoint, headers=headers, json=payload) as response:
                        if response.status_code != 200:
                            yield f"\n[Local Engine Error {response.status_code}]"
                            return
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data_json = json.loads(data_str)
                                    delta = data_json["choices"][0].get("delta", {})
                                    if "content" in delta and delta["content"]:
                                        yield delta["content"]
                                except Exception:
                                    continue
            except Exception as e:
                yield f"\n[Local Engine Connection Error: {str(e)}]"
            return

        # 5. OpenRouter Free Models
        elif provider == "openrouter":
            endpoint = "https://openrouter.ai/api/v1/chat/completions"
            selected_model = model or "deepseek/deepseek-r1:free"
            headers = {
                "Authorization": f"Bearer {api_key or ''}",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "NEXORA AI",
                "Content-Type": "application/json"
            }
            payload = {
                "model": selected_model,
                "messages": messages,
                "temperature": temperature,
                "stream": True
            }
            try:
                async with httpx.AsyncClient(timeout=90.0) as client:
                    async with client.stream("POST", endpoint, headers=headers, json=payload) as response:
                        if response.status_code != 200:
                            async for chunk in LLMClient._stream_pollinations(messages):
                                yield chunk
                            return
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data_json = json.loads(data_str)
                                    delta = data_json["choices"][0].get("delta", {})
                                    if "content" in delta and delta["content"]:
                                        yield delta["content"]
                                except Exception:
                                    continue
            except Exception:
                async for chunk in LLMClient._stream_pollinations(messages):
                    yield chunk
            return

        # 6. Default 100% Free Out-Of-The-Box Engine (Pollinations.ai)
        else:
            async for chunk in LLMClient._stream_pollinations(messages, model=model, temperature=temperature):
                yield chunk

    @staticmethod
    async def _stream_pollinations(
        messages: List[Dict[str, str]],
        model: Optional[str] = "openai",
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Pollinations.ai provides 100% free, unlimited AI text generation without subscriptions or API keys."""
        endpoint = "https://text.pollinations.ai/openai"
        payload = {
            "model": model or "openai",
            "messages": messages,
            "temperature": temperature,
            "stream": True
        }
        try:
            async with httpx.AsyncClient(timeout=75.0) as client:
                async with client.stream("POST", endpoint, json=payload, headers={"Content-Type": "application/json"}) as response:
                    if response.status_code != 200:
                        # Fallback to GET endpoint
                        full_prompt = "\n".join([f"{m.get('role','user')}: {m.get('content','')}" for m in messages])
                        r = await client.get(f"https://text.pollinations.ai/{httpx.URL(full_prompt)}")
                        yield r.text
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                data_json = json.loads(data_str)
                                delta = data_json["choices"][0].get("delta", {})
                                if "content" in delta and delta["content"]:
                                    yield delta["content"]
                            except Exception:
                                continue
        except Exception as e:
            yield f"NEXORA AI Response: I encountered a connection issue with the free endpoint ({str(e)}). You can also configure a free Groq or Gemini key in Settings for instantaneous responses."
