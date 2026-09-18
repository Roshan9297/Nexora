import io
from typing import Dict, Any, List, Optional
from pypdf import PdfReader
from docx import Document
from .llm_client import LLMClient

class DocumentAgent:
    """
    Document Agent for processing PDFs, Word Docs, Text, and answering questions.
    100% local extraction, zero cost.
    """

    @staticmethod
    def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
        fn = filename.lower()
        if fn.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            text_pages = []
            for idx, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                text_pages.append(f"--- Page {idx+1} ---\n{txt}")
            return "\n\n".join(text_pages)
        elif fn.endswith(".docx") or fn.endswith(".doc"):
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
        else:
            # Assume text/utf-8
            return file_bytes.decode("utf-8", errors="ignore")

    @staticmethod
    async def analyze_document(
        text: str,
        filename: str,
        task: str = "summary",
        question: Optional[str] = None,
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        # Truncate to reasonable context if extremely large
        truncated_text = text[:35000]

        if task == "summary":
            prompt = (
                f"You are NEXORA Document Agent. Please summarize the attached document ('{filename}').\n"
                "Provide:\n"
                "1. Executive Overview\n"
                "2. Key Takeaways & Core Themes\n"
                "3. Notable Data Points, Dates, or Figures\n"
                "4. Actionable Next Steps / Conclusions\n\n"
                f"Document Content:\n{truncated_text}"
            )
        else:
            prompt = (
                f"You are NEXORA Document Agent. The user has a specific question about the document '{filename}'.\n"
                f"User Question: {question}\n\n"
                f"Document Content:\n{truncated_text}\n\n"
                "Answer thoroughly based strictly on the document text. Cite page numbers or sections if mentioned."
            )

        messages = [
            {"role": "system", "content": "You are NEXORA AI Document Analysis Assistant."},
            {"role": "user", "content": prompt}
        ]

        result = await LLMClient.chat_complete(
            messages=messages,
            provider=provider,
            model=model,
            api_key=api_key
        )

        return {
            "filename": filename,
            "char_count": len(text),
            "word_count": len(text.split()),
            "analysis": result
        }
