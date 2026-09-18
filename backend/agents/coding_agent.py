import subprocess
import tempfile
import os
import sys
from typing import Dict, Any, Optional
from .llm_client import LLMClient

class CodingAgent:
    """
    Coding Agent: Code generation, refactoring, explanation, and safe local execution.
    """

    @staticmethod
    def execute_code(language: str, code: str) -> Dict[str, Any]:
        lang = language.lower().strip()
        timeout_seconds = 10

        try:
            if lang in ("python", "py"):
                with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False, encoding="utf-8") as f:
                    f.write(code)
                    temp_path = f.name

                cmd = [sys.executable, temp_path]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_seconds)
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass

                return {
                    "language": lang,
                    "stdout": res.stdout,
                    "stderr": res.stderr,
                    "exit_code": res.returncode,
                    "success": res.returncode == 0
                }

            elif lang in ("javascript", "js", "node"):
                with tempfile.NamedTemporaryFile(suffix=".js", mode="w", delete=False, encoding="utf-8") as f:
                    f.write(code)
                    temp_path = f.name

                cmd = ["node", temp_path]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_seconds)
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass

                return {
                    "language": lang,
                    "stdout": res.stdout,
                    "stderr": res.stderr,
                    "exit_code": res.returncode,
                    "success": res.returncode == 0
                }

            else:
                return {
                    "language": lang,
                    "stdout": "",
                    "stderr": f"Direct execution for '{language}' not supported in sandbox. Supported: python, javascript.",
                    "exit_code": 1,
                    "success": False
                }

        except subprocess.TimeoutExpired:
            return {
                "language": lang,
                "stdout": "",
                "stderr": f"Execution timed out after {timeout_seconds} seconds.",
                "exit_code": -1,
                "success": False
            }
        except Exception as e:
            return {
                "language": lang,
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1,
                "success": False
            }

    @staticmethod
    async def analyze_code(
        code: str,
        task: str = "review",
        language: str = "python",
        instruction: Optional[str] = None,
        provider: str = "pollinations",
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> str:
        tasks = {
            "review": "Review this code for bugs, security issues, performance bottlenecks, and best practices. Suggest improvements with diffs.",
            "explain": "Explain this code in detail: logic flow, algorithms used, and edge cases.",
            "test": "Write comprehensive unit tests for this code with pytest or jest.",
            "refactor": "Refactor this code to make it more elegant, maintainable, modular, and idiomatic.",
            "custom": instruction or "Analyze and improve this code."
        }

        prompt_task = tasks.get(task, tasks["review"])
        system_prompt = (
            "You are NEXORA Coding Agent, a world-class senior software architect.\n"
            "Provide production-ready, clean, well-documented code solutions with markdown syntax highlighting."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Task: {prompt_task}\nLanguage: {language}\n\nCode:\n```{language}\n{code}\n```"}
        ]

        return await LLMClient.chat_complete(
            messages=messages,
            provider=provider,
            model=model,
            api_key=api_key
        )
