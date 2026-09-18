from typing import List, Dict, Any, Optional, AsyncGenerator
from .llm_client import LLMClient

class ReasoningAgent:
    """
    Reasoning Agent: Mimics DeepSeek-R1 / OpenAI o1-o3 style deep Chain-of-Thought thinking.
    Streams an explicit <thought>...</thought> block followed by the synthesized final answer.
    """

    REASONING_SYSTEM_PROMPT = (
        "You are NEXORA Reasoning Engine (comparable to DeepSeek-R1 & OpenAI o3).\n"
        "When responding to the user, you MUST first conduct a rigorous, comprehensive step-by-step thinking process.\n"
        "Enclose your entire internal thinking process inside <thought> and </thought> tags.\n"
        "Inside <thought>:\n"
        "- Deconstruct the problem, definitions, and implicit constraints.\n"
        "- Explore candidate hypotheses, alternative angles, edge cases, and failure modes.\n"
        "- Validate assumptions with mathematical/logical proofs or code mental walkthroughs.\n"
        "- Refine the strategy and eliminate weaknesses.\n"
        "After </thought>, provide the polished, authoritative, clean final response without mentioning the thought tags."
    )

    @staticmethod
    async def stream_reasoning(
        messages: List[Dict[str, str]],
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        augmented_messages = [
            {"role": "system", "content": ReasoningAgent.REASONING_SYSTEM_PROMPT}
        ]
        for m in messages:
            if m.get("role") != "system":
                augmented_messages.append(m)

        async for chunk in LLMClient.chat_stream(
            messages=augmented_messages,
            provider=provider,
            model=model,
            api_key=api_key
        ):
            yield chunk
