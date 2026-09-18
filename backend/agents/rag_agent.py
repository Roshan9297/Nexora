import math
import re
from typing import List, Dict, Any, Optional
from .llm_client import LLMClient

class RAGAgent:
    """
    RAG / Knowledge Base Agent.
    Lightweight, robust in-memory vector store with TF-IDF cosine similarity.
    Requires zero subscription, zero external database, zero heavy C++ compilation.
    """

    # In-memory storage for collections: {collection_name: [{"id": str, "doc_title": str, "content": str, "tokens": dict}]}
    collections: Dict[str, List[Dict[str, Any]]] = {}

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r"\w+", text.lower())

    @staticmethod
    def _compute_tf(tokens: List[str]) -> Dict[str, float]:
        tf: Dict[str, float] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1.0
        total = len(tokens) or 1
        return {t: count / total for t, count in tf.items()}

    @staticmethod
    def add_document(collection: str, doc_id: str, title: str, content: str, chunk_size: int = 500, overlap: int = 100):
        if collection not in RAGAgent.collections:
            RAGAgent.collections[collection] = []

        # Split into overlapping chunks
        words = content.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i:i + chunk_size]
            chunks.append(" ".join(chunk_words))
            i += (chunk_size - overlap)
            if i >= len(words):
                break

        if not chunks:
            chunks = [content]

        for idx, chunk in enumerate(chunks):
            tokens = RAGAgent._tokenize(chunk)
            RAGAgent.collections[collection].append({
                "id": f"{doc_id}_chunk_{idx}",
                "doc_title": title,
                "content": chunk,
                "tf": RAGAgent._compute_tf(tokens)
            })

    @staticmethod
    def search_chunks(collection: str, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        if collection not in RAGAgent.collections or not RAGAgent.collections[collection]:
            return []

        q_tokens = RAGAgent._tokenize(query)
        q_tf = RAGAgent._compute_tf(q_tokens)
        docs = RAGAgent.collections[collection]

        # Calculate IDF
        N = len(docs)
        scores = []
        for item in docs:
            doc_tf = item["tf"]
            score = 0.0
            for term, q_val in q_tf.items():
                if term in doc_tf:
                    # IDF approximation
                    df = sum(1 for d in docs if term in d["tf"])
                    idf = math.log((N + 1) / (df + 1)) + 1.0
                    score += q_val * doc_tf[term] * idf
            scores.append((score, item))

        scores.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "id": item["id"],
                "doc_title": item["doc_title"],
                "content": item["content"],
                "score": round(score, 4)
            }
            for score, item in scores[:top_k] if score > 0
        ]

    @staticmethod
    async def query_knowledge_base(
        collection: str,
        query: str,
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        matched_chunks = RAGAgent.search_chunks(collection, query, top_k=4)

        if not matched_chunks:
            return {
                "collection": collection,
                "query": query,
                "chunks": [],
                "answer": "No relevant documents found in this Knowledge Base collection for your query."
            }

        context = "\n\n".join([
            f"--- Source: {c['doc_title']} (Relevance Score: {c['score']}) ---\n{c['content']}"
            for c in matched_chunks
        ])

        system_prompt = (
            "You are NEXORA RAG Knowledge Agent.\n"
            "Answer the user query based strictly on the provided retrieved knowledge chunks.\n"
            "Include source references to the document titles."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Query: {query}\n\nRetrieved Knowledge Context:\n{context}\n\nProvide an authoritative answer:"}
        ]

        answer = await LLMClient.chat_complete(
            messages=messages,
            provider=provider,
            model=model,
            api_key=api_key
        )

        return {
            "collection": collection,
            "query": query,
            "chunks": matched_chunks,
            "answer": answer
        }
