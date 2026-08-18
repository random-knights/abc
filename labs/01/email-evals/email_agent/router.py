"""Function-calling router loop."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from openinference.semconv.trace import SpanAttributes
from opentelemetry.trace import Status, StatusCode

from .observability import tracer
from .providers import ProviderAdapter, SYSTEM_PROMPT
from .sanitize import sanitize_error
from .tools import EmailTools, parse_arguments


@dataclass
class RunTranscript:
    provider: str
    model: str
    query: str
    events: list[str] = field(default_factory=list)
    tool_sequence: list[str] = field(default_factory=list)
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    tool_responses: list[dict[str, str]] = field(default_factory=list)
    router_turns: int = 0
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

    def as_experiment_output(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "model": self.model,
            "tool_calls": self.tool_calls,
            "tool_responses": self.tool_responses,
            "tool_sequence": self.tool_sequence,
            "final_output": self.final_response,
            "path_length": 1 + self.router_turns + len(self.tool_sequence),
            "error": self.error,
        }


def run_agent(
    *,
    query: str,
    provider: ProviderAdapter,
    tools: EmailTools,
    max_turns: int = 12,
) -> RunTranscript:
    transcript = RunTranscript(provider=provider.provider, model=provider.model, query=query)
    if provider.provider == "openai":
        messages: list[Any] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ]
    else:
        messages = [{"role": "user", "content": query}]
    tool_executor = ToolExecutor(
        provider=provider,
        tools=tools,
        messages=messages,
        transcript=transcript,
    )

    try:
        for turn in range(1, max_turns + 1):
            transcript.router_turns = turn
            transcript.events.append(f"router turn {turn}: calling model")
            with tracer.start_as_current_span(
                f"router_turn_{turn}", openinference_span_kind="chain"
            ) as router_span:
                router_span.set_attribute(
                    SpanAttributes.INPUT_VALUE,
                    json.dumps(messages, ensure_ascii=True, default=str),
                )
                router_span.set_attribute(
                    SpanAttributes.INPUT_MIME_TYPE, "application/json"
                )
                response = provider.router_call(messages)
                if response.tool_calls:
                    router_span.set_attribute(
                        SpanAttributes.OUTPUT_VALUE,
                        json.dumps(response.tool_calls, ensure_ascii=True, default=str),
                    )
                    router_span.set_attribute(
                        SpanAttributes.OUTPUT_MIME_TYPE, "application/json"
                    )
                    messages.append(provider.assistant_message(response))
                    tool_executor.execute_tool_calls(
                        response.tool_calls,
                        turn=turn,
                    )
                    router_span.set_status(Status(StatusCode.OK))
                    continue
                router_span.set_attribute(SpanAttributes.OUTPUT_VALUE, response.content)
                router_span.set_attribute(SpanAttributes.OUTPUT_MIME_TYPE, "text/plain")
                router_span.set_status(Status(StatusCode.OK))
                transcript.events.append(f"router turn {turn}: no tool calls")
                transcript.final_response = response.content
                return transcript
        transcript.error = f"router exceeded max_turns={max_turns}"
        return transcript
    except Exception as error:
        transcript.error = sanitize_error(error)
        return transcript


@dataclass
class ToolExecutor:
    provider: ProviderAdapter
    tools: EmailTools
    messages: list[Any]
    transcript: RunTranscript

    @tracer.chain(name="execute_tool_calls")
    def execute_tool_calls(
        self, tool_calls: list[dict[str, Any]], *, turn: int
    ) -> list[str]:
        names: list[str] = []
        self.transcript.events.append(
            f"router turn {turn}: tool calls "
            + json.dumps(
                [
                    {"name": call["name"], "arguments": call["arguments"]}
                    for call in tool_calls
                ],
                ensure_ascii=True,
            )
        )
        for call in tool_calls:
            args = parse_arguments(call["arguments"])
            self.transcript.tool_calls.append(
                {"name": call["name"], "arguments": args, "turn": turn}
            )
            result = self.tools.call(call["name"], args)
            names.append(call["name"])
            self.transcript.tool_sequence.append(call["name"])
            self.transcript.tool_responses.append(
                {"tool_name": call["name"], "tool_response": result}
            )
            self.transcript.events.append(
                f"tool result {call['name']}: {_preview(result)}"
            )
            self.messages.append(self.provider.tool_result_message(call, result))
        return names


def _preview(value: str, limit: int = 900) -> str:
    text = " ".join(value.split())
    if len(text) <= limit:
        return text
    return text[:limit] + " ... [truncated]"
