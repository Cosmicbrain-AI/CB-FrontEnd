"""HTTP API routes for chat, streaming, and session management.

This layer only validates request payloads and delegates all model logic to
`GeminiService`. Streaming uses Server-Sent Events (SSE) to progressively send
chunks to the client, which is resilient and easy to consume from browsers.
"""

from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.services.gemini import GeminiService, get_gemini_service


router = APIRouter()


class ChatRequest(BaseModel):
    """Schema for chat requests across sync and streaming endpoints."""
    message: str = Field(..., min_length=1)
    system_instruction: str | None = None
    temperature: float | None = None
    max_output_tokens: int | None = None
    session_id: str | None = Field(
        default=None,
        description="Provide to enable per-session conversation memory.",
    )
    google_search: bool = Field(
        default=True,
        description="Enable Google Search grounding for fresher, grounded info.",
    )
    model: str | None = Field(
        default=None,
        description="Override model per request (e.g., gemini-2.5-flash).",
    )
    explain: bool = Field(
        default=False,
        description="Stream a brief high-level explanation before recommendations (no chain-of-thought).",
    )
    include_thoughts: bool = Field(
        default=False,
        description="Enable Gemini 2.5 'thought summaries' streaming (not raw chain-of-thought).",
    )
    thinking_budget: int | None = Field(
        default=None,
        description="Thinking token budget: -1 dynamic (default), 0 off, or positive integer.",
    )


class ChatResponse(BaseModel):
    """Response wrapper for non-streaming chat results."""

    text: str


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> ChatResponse:
    try:
        text = await service.generate(
            prompt=payload.message,
            system_instruction=payload.system_instruction,
            temperature=payload.temperature,
            max_output_tokens=payload.max_output_tokens,
            session_id=payload.session_id,
            use_google_search=payload.google_search,
            model_override=payload.model,
            explain=payload.explain,
            include_thoughts=payload.include_thoughts,
            thinking_budget=payload.thinking_budget,
        )
        return ChatResponse(text=text)
    except Exception as exc:  # The service already raises descriptive errors
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def sse_event(data: str) -> bytes:
    """Format a single SSE event frame."""
    return f"data: {data}\n\n".encode("utf-8")


@router.post("/chat/stream")
async def chat_stream(
    payload: ChatRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> StreamingResponse:
    async def event_generator() -> AsyncGenerator[bytes, None]:
        async for chunk in service.generate_stream(
            prompt=payload.message,
            system_instruction=payload.system_instruction,
            temperature=payload.temperature,
            max_output_tokens=payload.max_output_tokens,
            session_id=payload.session_id,
            use_google_search=payload.google_search,
            model_override=payload.model,
            explain=payload.explain,
            include_thoughts=payload.include_thoughts,
            thinking_budget=payload.thinking_budget,
        ):
            yield sse_event(chunk)
        yield sse_event("[DONE]")

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(
        event_generator(), media_type="text/event-stream", headers=headers
    )


class ResetRequest(BaseModel):
    session_id: str


@router.post("/chat/reset")
async def reset_session(
    payload: ResetRequest, service: GeminiService = Depends(get_gemini_service)
) -> dict:
    await service.reset_session(payload.session_id)
    return {"status": "reset", "session_id": payload.session_id}

