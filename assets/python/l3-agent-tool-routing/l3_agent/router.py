"""Function-calling router loop."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from .providers import ProviderAdapter, SYSTEM_PROMPT
from .sanitize import sanitize_error
from .tools import LabTools, parse_arguments


@dataclass
class RunTranscript:
    provider: str
    model: str
    query: str
    events: list[str] = field(default_factory=list)
    tool_sequence: list[str] = field(default_factory=list)
    final_response: str = ""
    error: str | None = None

    def render(self) -> str:
        lines = [
            f"provider: {self.provider}",
            f"model: {self.model}",
            f"query: {self.query}",
            "",
        ]
        lines.extend(self.events)
        if self.error:
            lines.extend(["", f"ERROR: {self.error}"])
        else:
            lines.extend(["", "FINAL RESPONSE:", self.final_response])
        return "\n".join(lines)


def run_agent(
    *,
    query: str,
    provider: ProviderAdapter,
    tools: LabTools,
    max_turns: int = 8,
) -> RunTranscript:
    transcript = RunTranscript(provider=provider.provider, model=provider.model, query=query)
    if provider.provider == "openai":
        messages: list[Any] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ]
    else:
        messages = [{"role": "user", "content": query}]

    try:
        for turn in range(1, max_turns + 1):
            transcript.events.append(f"router turn {turn}: calling model")
            response = provider.router_call(messages)
            if response.tool_calls:
                transcript.events.append(
                    "router turn "
                    + str(turn)
                    + ": tool calls "
                    + json.dumps(
                        [
                            {"name": c["name"], "arguments": c["arguments"]}
                            for c in response.tool_calls
                        ],
                        ensure_ascii=True,
                    )
                )
                messages.append(provider.assistant_message(response))
                for call in response.tool_calls:
                    args = parse_arguments(call["arguments"])
                    result = tools.call(call["name"], args)
                    transcript.tool_sequence.append(call["name"])
                    transcript.events.append(
                        f"tool result {call['name']}: {_preview(result)}"
                    )
                    messages.append(provider.tool_result_message(call, result))
                continue
            transcript.events.append(f"router turn {turn}: no tool calls")
            transcript.final_response = response.content
            return transcript
        transcript.error = f"router exceeded max_turns={max_turns}"
        return transcript
    except Exception as error:
        transcript.error = sanitize_error(error)
        return transcript


def _preview(value: str, limit: int = 900) -> str:
    text = " ".join(value.split())
    if len(text) <= limit:
        return text
    return text[:limit] + " ... [truncated]"
