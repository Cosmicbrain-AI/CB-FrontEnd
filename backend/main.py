"""Application entrypoint for the Gemini Chatbot FastAPI service.

This module wires core middleware, mounts the API router, and exposes a
`FastAPI` instance that is compatible with ASGI servers such as Uvicorn.
"""

from contextlib import asynccontextmanager
import os
from typing import AsyncIterator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router as api_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Load environment on startup and provide a hook for future resources.

    Using `override=True` ensures values in `.env` take precedence over any
    previously exported shell variables (useful when rotating API keys).
    """
    load_dotenv(override=True)
    yield


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(title="Gemini Chatbot API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api")

    return app


app = create_app()


@app.get("/healthz")
async def healthz() -> dict:
    """Liveness probe used by tests and orchestration."""
    return {"status": "ok"}
