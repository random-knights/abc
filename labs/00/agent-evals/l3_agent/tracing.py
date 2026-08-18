"""Append-only model-call trace records."""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .impact import estimate_aieds


@dataclass
class TraceSink:
    path: Path
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    source: str = "agent-evals-course"
    cwd_label: str = "agent-evals-course"

    def append(
        self,
        *,
        provider: str,
        model: str,
        tokens_in: int,
        tokens_out: int,
        tool_calls_chosen: list[str],
        latency_ms: int,
        outcome: str,
        run_id: str,
        call_index: int,
        error_type: str | None = None,
    ) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        impact = estimate_aieds(model, tokens_in, tokens_out)
        record: dict[str, Any] = {
            "tsUtc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "provider": provider,
            "model": model,
            "tokensIn": tokens_in,
            "tokensOut": tokens_out,
            **impact,
            "source": self.source,
            "sessionId": self.session_id,
            "cwd": self.cwd_label,
            "latencyMs": latency_ms,
            "toolCallsChosen": tool_calls_chosen,
            "outcome": outcome,
            "runId": run_id,
            "callIndex": call_index,
        }
        if error_type:
            record["errorType"] = error_type
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=True) + "\n")


def timed_ms() -> tuple[float, callable]:
    start = time.perf_counter()

    def elapsed() -> int:
        return int((time.perf_counter() - start) * 1000)

    return start, elapsed
