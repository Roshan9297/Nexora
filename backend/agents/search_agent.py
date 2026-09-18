from typing import List, Dict, Any, Optional
from duckduckgo_search import DDGS
from .llm_client import LLMClient

class SearchAgent:
    """
    100% Free Live Web Search Agent using DuckDuckGo.
    No API key required, no subscriptions, unlimited searches.
    """

    @staticmethod
    def search_web(query: str, max_results: int = 6) -> List[Dict[str, Any]]:
        results = []
        try:
            with DDGS() as ddgs:
                ddg_results = ddgs.text(query, max_results=max_results)
                for r in ddg_results:
                    results.append({
                        "title": r.get("title", ""),
                        "link": r.get("href", ""),
                        "snippet": r.get("body", "")
                    })
        except Exception as e:
            results.append({
                "title": f"Search fallback for '{query}'",
                "link": f"https://duckduckgo.com/?q={query}",
                "snippet": f"Could not retrieve direct snippet: {str(e)}"
            })
        return results

    @staticmethod
    async def answer_with_search(
        query: str,
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        sources = SearchAgent.search_web(query, max_results=5)
        
        sources_context = "\n\n".join([
            f"Source [{idx+1}]: {s['title']}\nURL: {s['link']}\nSnippet: {s['snippet']}"
            for idx, s in enumerate(sources)
        ])

        system_prompt = (
            "You are NEXORA Search Agent. You have access to real-time live web search results.\n"
            "Synthesize an accurate, factual, well-formatted markdown response to the user's question.\n"
            "Cite sources inline using markdown footnotes or links (e.g. [1](url) or [Source Name](url)).\n"
            "Be concise, clear, and up-to-date."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"User Query: {query}\n\nLive Web Search Results:\n{sources_context}\n\nPlease provide a comprehensive answer citing these sources."}
        ]

        answer = await LLMClient.chat_complete(
            messages=messages,
            provider=provider,
            model=model,
            api_key=api_key
        )

        return {
            "query": query,
            "sources": sources,
            "answer": answer
        }
