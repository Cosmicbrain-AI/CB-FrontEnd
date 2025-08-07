import os
import sys
import time
from typing import Any, Dict, Iterable, Tuple

import requests


API_BASE = os.getenv("API_BASE", "http://127.0.0.1:8000")


def post(url: str, json: Dict[str, Any], timeout: int = 120) -> requests.Response:
    resp = requests.post(url, json=json, timeout=timeout)
    resp.raise_for_status()
    return resp


def sse_lines(resp: requests.Response) -> Iterable[str]:
    buffer = ""
    for chunk in resp.iter_content(chunk_size=None):
        if not chunk:
            continue
        buffer += chunk.decode("utf-8", errors="ignore")
        while "\n\n" in buffer:
            block, buffer = buffer.split("\n\n", 1)
            if block.startswith("data: "):
                yield block[len("data: ") :].strip()


def chat(payload: Dict[str, Any]) -> str:
    url = f"{API_BASE}/api/chat"
    data = post(url, payload).json()
    return data.get("text", "")


def chat_stream(payload: Dict[str, Any]) -> Tuple[str, int]:
    url = f"{API_BASE}/api/chat/stream"
    with requests.post(url, json=payload, stream=True, timeout=180) as resp:
        resp.raise_for_status()
        text_parts = []
        thought_count = 0
        for line in sse_lines(resp):
            if line == "[DONE]":
                break
            if line.startswith("[THOUGHT]"):
                thought_count += 1
                print("\nTHOUGHT:", line[len("[THOUGHT]") :])
            else:
                text_parts.append(line)
                print(line, end="", flush=True)
        print()
        return ("".join(text_parts), thought_count)


def reset(session_id: str) -> None:
    post(f"{API_BASE}/api/chat/reset", {"session_id": session_id}, timeout=30)


def section(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def main() -> None:
    session_id = "e2e_demo"
    section(f"API_BASE={API_BASE}")
    section("Healthcheck")
    r = requests.get(f"{API_BASE}/healthz", timeout=10)
    print("Health:", r.status_code, r.text)

    section("Resetting session")
    reset(session_id)
    print("Session reset.")

    # 1) Basic chat (no search, no thoughts)
    section("1) Basic chat - no search, no thoughts")
    print(
        chat(
            {
                "message": "I want a robot to separate plastic bottles by color on a conveyor.",
                "session_id": session_id,
                "google_search": False,
            }
        )
    )

    # 2) Chat with Google Search enabled (non-streaming)
    section("2) Chat with Google Search (model decides to use the tool)")
    print(
        chat(
            {
                "message": "Recommend cameras and lighting for robust color detection.",
                "session_id": session_id,
                "google_search": True,
            }
        )
    )

    # 3) Streaming with dynamic thinking and thought summaries
    section("3) Streaming with dynamic thinking and thought summaries")
    t0 = time.time()
    _, thoughts = chat_stream(
        {
            "message": "Propose a data collection shot list to train a VLA policy.",
            "session_id": session_id,
            "google_search": True,
            "include_thoughts": True,
            "thinking_budget": -1,
        }
    )
    print(f"Thought chunks received: {thoughts} (elapsed {time.time()-t0:.2f}s)")

    # 4) Streaming with thinking disabled (budget 0)
    section("4) Streaming with thinking disabled (budget=0)")
    chat_stream(
        {
            "message": "List potential failure modes and how to include them in demos.",
            "session_id": session_id,
            "google_search": False,
            "include_thoughts": True,
            "thinking_budget": 0,
        }
    )

    # 5) Streaming with explain preface
    section("5) Streaming with explain preface")
    chat_stream(
        {
            "message": "Give an evaluation checklist and success metrics.",
            "session_id": session_id,
            "google_search": False,
            "explain": True,
            "include_thoughts": False,
        }
    )

    # 6) Switch task and test memory carryover
    section("6) Switch task: laundry folding planning (memory + search + thoughts)")
    chat_stream(
        {
            "message": "Now switch task: fold t-shirts of different colors on a table.",
            "session_id": session_id,
            "google_search": True,
            "include_thoughts": True,
            "thinking_budget": -1,
        }
    )

    # 7) Model override example
    section("7) Model override example (if you want to try another 2.5 model)")
    print(
        chat(
            {
                "message": "Summarize a procurement list: robot, end-effector, cameras, lights, mounts.",
                "session_id": session_id,
                "google_search": False,
                "model": os.getenv("MODEL_OVERRIDE"),  # optional
            }
        )
    )

    print("\nE2E test complete.")


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        print("HTTP error:", e, file=sys.stderr)
        try:
            print("Server response:", e.response.text, file=sys.stderr)
        except Exception:  # noqa: BLE001
            pass
        sys.exit(1)
    except Exception as e:  # noqa: BLE001
        print("Error:", e, file=sys.stderr)
        sys.exit(1)

