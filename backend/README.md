## Gemini Chatbot FastAPI Backend

Production-ready FastAPI backend for a robotics training assistant powered by Gemini 2.5. Includes session memory, Google Search tool grounding, optional thought summaries, and SSE streaming.

### Requirements
- Python 3.13
- A Gemini API key from AI Studio

### Setup
1) Create a virtualenv and install deps
```
cd /Users/keval/Documents/VSCode/CB-FrontEnd/backend
python3 -m venv .venv
source .venv/bin/activate
uv sync
```

2) Create `.env` next to `pyproject.toml`
```
GOOGLE_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
SYSTEM_PROMPT=You are a Robotics Training Assistant... (optional override)
CORS_ALLOW_ORIGINS=*
```

3) Start the API (single-process, good for streaming)
```
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Endpoints
- `GET /healthz`
- `POST /api/chat` (JSON)
- `POST /api/chat/stream` (Server-Sent Events)
- `POST /api/chat/reset` (reset per-session memory)

### Request body fields
- `message` string (required)
- `session_id` string (optional) enables memory
- `system_instruction` string (optional) per-call system prompt
- `temperature` number (optional)
- `max_output_tokens` number (optional)
- `google_search` boolean (default true) exposes Google Search tool; model decides if/when to use
- `include_thoughts` boolean (default false) stream Gemini 2.5 thought summaries (not raw chain-of-thought)
- `thinking_budget` integer (optional) set reasoning budget: `-1` dynamic, `0` off, `>0` fixed budget
- `explain` boolean (default false) prepend brief “understanding” summary before recommendations
- `model` string (optional) per-request model override

### Example calls
Non-streaming
```
curl -s -X POST http://127.0.0.1:8000/api/chat \
  -H 'content-type: application/json' \
  -d '{
    "message": "Plan a robot to sort bottles by color on a conveyor.",
    "session_id": "sess1",
    "google_search": true
  }'
```

Streaming (SSE)
```
curl -N -sS -X POST http://127.0.0.1:8000/api/chat/stream \
  -H 'content-type: application/json' \
  -d '{
    "message": "Give me a shot list for laundry folding demos.",
    "session_id": "sess2",
    "include_thoughts": true,
    "thinking_budget": -1
  }'
```

Notes on streaming
- SSE lines are sent as `data: ...\n\n`
- Thought summaries are prefixed in-stream as `[THOUGHT]...` so your UI can render separately
- Headers: `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`
- Avoid piping to `head/less` which will abort the stream

### Session memory
- Include `session_id` to accumulate conversation history
- Reset with:
```
curl -s -X POST http://127.0.0.1:8000/api/chat/reset \
  -H 'content-type: application/json' \
  -d '{"session_id": "sess1"}'
```

### Behavior and safety
- Uses Gemini 2.5 models; the model decides when to use Search if `google_search` is true
- Thought summaries provide insight without exposing raw chain-of-thought
- You can disable reasoning with `thinking_budget: 0`, or allow dynamic with `-1`

### Run the full test script
```
uv run python tests/full_e2e_test.py
```
This script covers: health, session reset, non-streaming, streaming with/without thinking, explain preface, memory, and optional model override via `MODEL_OVERRIDE` env.

### Troubleshooting
- 400 INVALID_ARGUMENT API key expired: update `GOOGLE_API_KEY` in `.env`, then restart the server
- If SSE “ended prematurely”, ensure single-process server (`uvicorn` without `--reload`) and don’t pipe the stream

