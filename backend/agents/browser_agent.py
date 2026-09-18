import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional
from .llm_client import LLMClient

class BrowserAgent:
    """
    Browser Agent for live web browsing, scraping, content extraction, and page Q&A.
    """

    @staticmethod
    async def fetch_page(url: str) -> Dict[str, Any]:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    return {"success": False, "error": f"HTTP {resp.status_code}"}

                soup = BeautifulSoup(resp.text, "html.parser")

                # Remove script, style, nav, footer to get clean text
                for tag in soup(["script", "style", "nav", "footer", "iframe", "svg"]):
                    tag.decompose()

                title = soup.title.string.strip() if soup.title and soup.title.string else url
                
                # Extract main content
                body = soup.find("main") or soup.find("article") or soup.find("body")
                raw_text = body.get_text(separator="\n", strip=True) if body else soup.get_text()

                # Clean multiple newlines
                lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
                clean_content = "\n".join(lines[:500]) # Cap at reasonable length

                # Collect key links
                links = []
                for a in soup.find_all("a", href=True)[:15]:
                    href = a["href"]
                    text = a.get_text().strip()
                    if text and href.startswith("http"):
                        links.append({"text": text, "url": href})

                return {
                    "success": True,
                    "url": str(resp.url),
                    "title": title,
                    "content": clean_content,
                    "links": links
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    async def browse_and_analyze(
        url: str,
        question: Optional[str] = None,
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        page_data = await BrowserAgent.fetch_page(url)
        if not page_data.get("success"):
            return page_data

        content = page_data["content"]
        prompt = (
            f"You are NEXORA Browser Agent.\n"
            f"Web Page Title: {page_data['title']}\n"
            f"URL: {url}\n\n"
            f"Page Content:\n{content[:25000]}\n\n"
        )
        if question:
            prompt += f"User Question about this page: {question}\nPlease answer accurately based on the page."
        else:
            prompt += "Provide an executive summary, list of core topics discussed, and notable takeaways."

        messages = [
            {"role": "system", "content": "You are NEXORA Browser & Research Assistant."},
            {"role": "user", "content": prompt}
        ]

        analysis = await LLMClient.chat_complete(
            messages=messages,
            provider=provider,
            model=model,
            api_key=api_key
        )

        return {
            "success": True,
            "url": page_data["url"],
            "title": page_data["title"],
            "analysis": analysis,
            "links": page_data.get("links", [])
        }
