"""Gemini service wrapper encapsulating model calls, memory, and streaming.

Responsibilities
- Maintain per-session chat history (in-memory) with lightweight locking
- Configure tools (Google Search) and optional reasoning capabilities
- Provide both non-streaming and streaming generation methods
"""

from __future__ import annotations

import asyncio
import os
from typing import AsyncGenerator, Optional

from google import genai
from google.genai import types


DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
DEFAULT_SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT",
    (
        "You are a Robotics Training Assistant for a platform that converts user-"
        "recorded task demonstrations into VLA (vision-language-action) policies. "
        "Follow this interaction policy for every turn: "
        "1) Understanding: Briefly restate the user's goal and constraints in 1-3 bullet points. "
        "2) Clarify: If any key detail is missing (task, objects, environment, robot limits, success criteria, safety), ask 1-3 targeted clarification questions and stop. "
        "3) If sufficient info: Provide Recommendations with: robot category and example models (manipulator, mobile base, mobile manipulator, humanoid), end-effectors, sensors; a concise data collection plan (shot list with camera views, number of takes, variations, edge cases); evaluation checklist and success metrics; safety considerations; optional procurement list. "
        "4) Keep outputs concise, scannable, and numbered/bulleted. "
        "5) Do not reveal internal chain-of-thought; think privately and output only conclusions and brief rationale. "
        "If web grounding is enabled, incorporate relevant facts while keeping citations implicit."
    ),
)


class GeminiService:
    def __init__(self, client: genai.Client, model: str = DEFAULT_MODEL):
        self.client = client
        self.model = model
        self._sessions: dict[str, list[types.Content]] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    def _get_lock(self, session_id: str) -> asyncio.Lock:
        """Return a per-session lock to serialize access to that session's history."""
        lock = self._locks.get(session_id)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[session_id] = lock
        return lock

    async def reset_session(self, session_id: str) -> None:
        """Clear all stored history for a given session id."""
        async with self._get_lock(session_id):
            self._sessions.pop(session_id, None)

    async def generate(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None,
        session_id: Optional[str] = None,
        use_google_search: bool = False,
        model_override: Optional[str] = None,
        explain: bool = False,
        include_thoughts: bool = False,
        thinking_budget: Optional[int] = None,
    ) -> str:
        effective_instruction = system_instruction or DEFAULT_SYSTEM_PROMPT
        tools: list[types.Tool] = []
        if use_google_search:
            tools.append(types.Tool(google_search=types.GoogleSearch()))

        thinking_cfg: types.ThinkingConfig | None = None
        if include_thoughts or thinking_budget is not None:
            budget = -1 if thinking_budget is None else thinking_budget
            thinking_cfg = types.ThinkingConfig(
                include_thoughts=include_thoughts,
                thinking_budget=budget,
            )

        config = types.GenerateContentConfig(
            system_instruction=effective_instruction if effective_instruction else None,
            temperature=temperature if temperature is not None else None,
            max_output_tokens=max_output_tokens if max_output_tokens else None,
            tools=tools if tools else None,
            thinking_config=thinking_cfg,
        )

        model_to_use = model_override or self.model

        if session_id:
            async with self._get_lock(session_id):
                history = self._sessions.setdefault(session_id, [])
                history.append(
                    types.UserContent(parts=[types.Part.from_text(text=prompt)])
                )
                if explain:
                    history.append(
                        types.UserContent(
                            parts=[
                                types.Part.from_text(
                                    text=(
                                        "Briefly summarize your understanding and key constraints "
                                        "in 1-2 bullets, then proceed with recommendations."
                                    )
                                )
                            ]
                        )
                    )
                response = await self.client.aio.models.generate_content(
                    model=model_to_use,
                    contents=history,
                    config=config,
                )
                text = response.text or ""
                history.append(
                    types.ModelContent(parts=[types.Part.from_text(text=text)])
                )
                return text

        request_contents: list[types.Content | str] | str = prompt
        if explain:
            request_contents = [
                types.UserContent(parts=[types.Part.from_text(text=prompt)]),
                types.UserContent(
                    parts=[
                        types.Part.from_text(
                            text=(
                                "Briefly summarize your understanding and key constraints "
                                "in 1-2 bullets, then proceed with recommendations."
                            )
                        )
                    ]
                ),
            ]

        response = await self.client.aio.models.generate_content(
            model=model_to_use,
            contents=request_contents,
            config=config,
        )
        return response.text or ""

    async def generate_stream(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None,
        session_id: Optional[str] = None,
        use_google_search: bool = False,
        model_override: Optional[str] = None,
        explain: bool = False,
        include_thoughts: bool = False,
        thinking_budget: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        effective_instruction = system_instruction or DEFAULT_SYSTEM_PROMPT
        tools: list[types.Tool] = []
        if use_google_search:
            tools.append(types.Tool(google_search=types.GoogleSearch()))

        thinking_cfg: types.ThinkingConfig | None = None
        if include_thoughts or thinking_budget is not None:
            budget = -1 if thinking_budget is None else thinking_budget
            thinking_cfg = types.ThinkingConfig(
                include_thoughts=include_thoughts,
                thinking_budget=budget,
            )

        config = types.GenerateContentConfig(
            system_instruction=effective_instruction if effective_instruction else None,
            temperature=temperature if temperature is not None else None,
            max_output_tokens=max_output_tokens if max_output_tokens else None,
            tools=tools if tools else None,
            thinking_config=thinking_cfg,
        )

        model_to_use = model_override or self.model

        if session_id:
            async with self._get_lock(session_id):
                history = self._sessions.setdefault(session_id, [])
                history.append(
                    types.UserContent(parts=[types.Part.from_text(text=prompt)])
                )
                if explain:
                    history.append(
                        types.UserContent(
                            parts=[
                                types.Part.from_text(
                                    text=(
                                        "Briefly summarize your understanding and key constraints "
                                        "in 1-2 bullets, then proceed with recommendations."
                                    )
                                )
                            ]
                        )
                    )
                stream = await self.client.aio.models.generate_content_stream(
                    model=model_to_use,
                    contents=history,
                    config=config,
                )
                collected = []
                async for chunk in stream:
                    # Stream thought summaries and answer parts
                    # Fall back to chunk.text if parts are not detailed
                    emitted_part = False
                    if getattr(chunk, "candidates", None):
                        for part in chunk.candidates[0].content.parts:
                            if getattr(part, "text", None):
                                emitted_part = True
                                if getattr(part, "thought", False):
                                    collected.append(part.text)
                                    yield f"[THOUGHT]{part.text}"
                                else:
                                    collected.append(part.text)
                                    yield part.text
                    if not emitted_part and getattr(chunk, "text", None):
                        collected.append(chunk.text)
                        yield chunk.text
                final_text = "".join(collected)
                history.append(
                    types.ModelContent(parts=[types.Part.from_text(text=final_text)])
                )
                return

        request_contents: list[types.Content | str] | str = prompt
        if explain:
            request_contents = [
                types.UserContent(parts=[types.Part.from_text(text=prompt)]),
                types.UserContent(
                    parts=[
                        types.Part.from_text(
                            text=(
                                "Briefly summarize your understanding and key constraints "
                                "in 1-2 bullets, then proceed with recommendations."
                            )
                        )
                    ]
                ),
            ]

        stream = await self.client.aio.models.generate_content_stream(
            model=model_to_use,
            contents=request_contents,
            config=config,
        )
        async for chunk in stream:
            emitted_part = False
            if getattr(chunk, "candidates", None):
                for part in chunk.candidates[0].content.parts:
                    if getattr(part, "text", None):
                        emitted_part = True
                        if getattr(part, "thought", False):
                            yield f"[THOUGHT]{part.text}"
                        else:
                            yield part.text
            if not emitted_part and getattr(chunk, "text", None):
                yield chunk.text


def _build_client() -> genai.Client:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GOOGLE_API_KEY. Set it in env or .env file.")
    http_options = types.HttpOptions()
    return genai.Client(api_key=api_key, http_options=http_options)


_singleton_service: GeminiService | None = None


def get_gemini_service() -> GeminiService:
    global _singleton_service
    if _singleton_service is None:
        _singleton_service = GeminiService(client=_build_client())
    return _singleton_service

