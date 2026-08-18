"""Provider adapters for the L3 lab."""

from __future__ import annotations

import json
import os
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from anthropic import Anthropic
from openai import OpenAI

from .tools import ANTHROPIC_TOOLS, OPENAI_TOOLS, VisualizationConfig
from .tracing import TraceSink, timed_ms


SYSTEM_PROMPT = (
    "You are a helpful assistant that can answer questions about this data set. "
    "Use ASCII only. Do not use em dashes or en dashes."
)


@dataclass
class ModelResponse:
    content: str
    tool_calls: list[dict[str, Any]]
    raw_message: Any


class ProviderAdapter(ABC):
    provider: str
    model: str

    def __init__(self, *, model: str, trace: TraceSink, run_id: str) -> None:
        self.model = model
        self.trace = trace
        self.run_id = run_id
        self.call_index = 0

    @abstractmethod
    def router_call(self, messages: list[dict[str, Any]]) -> ModelResponse:
        ...

    @abstractmethod
    def tool_result_message(self, tool_call: dict[str, Any], content: str) -> dict[str, Any]:
        ...

    @abstractmethod
    def assistant_message(self, response: ModelResponse) -> dict[str, Any]:
        ...

    @abstractmethod
    def complete_text(self, prompt: str, *, purpose: str) -> str:
        ...

    @abstractmethod
    def structured_chart_config(self, prompt: str) -> VisualizationConfig:
        ...

    def _trace(
        self,
        *,
        tokens_in: int,
        tokens_out: int,
        tool_calls: list[str],
        latency_ms: int,
        outcome: str,
        error_type: str | None = None,
    ) -> None:
        self.call_index += 1
        self.trace.append(
            provider=self.provider,
            model=self.model,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            tool_calls_chosen=tool_calls,
            latency_ms=latency_ms,
            outcome=outcome,
            run_id=self.run_id,
            call_index=self.call_index,
            error_type=error_type,
        )


class OpenAIAdapter(ProviderAdapter):
    provider = "openai"

    def __init__(self, *, model: str, trace: TraceSink, run_id: str) -> None:
        super().__init__(model=model, trace=trace, run_id=run_id)
        self.client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    def router_call(self, messages: list[dict[str, Any]]) -> ModelResponse:
        _, elapsed = timed_ms()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=OPENAI_TOOLS,
            )
            message = response.choices[0].message
            calls = []
            for call in message.tool_calls or []:
                calls.append(
                    {
                        "id": call.id,
                        "name": call.function.name,
                        "arguments": call.function.arguments,
                    }
                )
            usage = response.usage
            self._trace(
                tokens_in=usage.prompt_tokens if usage else 0,
                tokens_out=usage.completion_tokens if usage else 0,
                tool_calls=[c["name"] for c in calls],
                latency_ms=elapsed(),
                outcome="success",
            )
            return ModelResponse(message.content or "", calls, message)
        except Exception as error:
            self._trace(
                tokens_in=0,
                tokens_out=0,
                tool_calls=[],
                latency_ms=elapsed(),
                outcome="error",
                error_type=type(error).__name__,
            )
            raise

    def assistant_message(self, response: ModelResponse) -> dict[str, Any]:
        return response.raw_message

    def tool_result_message(self, tool_call: dict[str, Any], content: str) -> dict[str, Any]:
        return {
            "role": "tool",
            "tool_call_id": tool_call["id"],
            "content": content,
        }

    def complete_text(self, prompt: str, *, purpose: str) -> str:
        _, elapsed = timed_ms()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
            )
            usage = response.usage
            self._trace(
                tokens_in=usage.prompt_tokens if usage else 0,
                tokens_out=usage.completion_tokens if usage else 0,
                tool_calls=[],
                latency_ms=elapsed(),
                outcome=f"success:{purpose}",
            )
            return response.choices[0].message.content or ""
        except Exception as error:
            self._trace(
                tokens_in=0,
                tokens_out=0,
                tool_calls=[],
                latency_ms=elapsed(),
                outcome=f"error:{purpose}",
                error_type=type(error).__name__,
            )
            raise

    def structured_chart_config(self, prompt: str) -> VisualizationConfig:
        _, elapsed = timed_ms()
        try:
            response = self.client.beta.chat.completions.parse(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format=VisualizationConfig,
            )
            usage = response.usage
            self._trace(
                tokens_in=usage.prompt_tokens if usage else 0,
                tokens_out=usage.completion_tokens if usage else 0,
                tool_calls=[],
                latency_ms=elapsed(),
                outcome="success:chart_config",
            )
            parsed = response.choices[0].message.parsed
            if parsed is None:
                raise ValueError("structured output was empty")
            return parsed
        except Exception as error:
            self._trace(
                tokens_in=0,
                tokens_out=0,
                tool_calls=[],
                latency_ms=elapsed(),
                outcome="error:chart_config",
                error_type=type(error).__name__,
            )
            raise


class AnthropicAdapter(ProviderAdapter):
    provider = "anthropic"

    def __init__(self, *, model: str, trace: TraceSink, run_id: str) -> None:
        super().__init__(model=model, trace=trace, run_id=run_id)
        self.client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    def router_call(self, messages: list[dict[str, Any]]) -> ModelResponse:
        _, elapsed = timed_ms()
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1200,
                system=SYSTEM_PROMPT,
                messages=messages,
                tools=ANTHROPIC_TOOLS,
            )
            calls = []
            text_parts = []
            for block in response.content:
                if block.type == "tool_use":
                    calls.append(
                        {
                            "id": block.id,
                            "name": block.name,
                            "arguments": block.input,
                        }
                    )
                elif block.type == "text":
                    text_parts.append(block.text)
            self._trace(
                tokens_in=response.usage.input_tokens,
                tokens_out=response.usage.output_tokens,
                tool_calls=[c["name"] for c in calls],
                latency_ms=elapsed(),
                outcome="success",
            )
            return ModelResponse("\n".join(text_parts), calls, response)
        except Exception as error:
            self._trace(
                tokens_in=0,
                tokens_out=0,
                tool_calls=[],
                latency_ms=elapsed(),
                outcome="error",
                error_type=type(error).__name__,
            )
            raise

    def assistant_message(self, response: ModelResponse) -> dict[str, Any]:
        return {"role": "assistant", "content": response.raw_message.content}

    def tool_result_message(self, tool_call: dict[str, Any], content: str) -> dict[str, Any]:
        return {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": tool_call["id"],
                    "content": content,
                }
            ],
        }

    def complete_text(self, prompt: str, *, purpose: str) -> str:
        _, elapsed = timed_ms()
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1200,
                messages=[{"role": "user", "content": prompt}],
            )
            self._trace(
                tokens_in=response.usage.input_tokens,
                tokens_out=response.usage.output_tokens,
                tool_calls=[],
                latency_ms=elapsed(),
                outcome=f"success:{purpose}",
            )
            return "\n".join(
                block.text for block in response.content if block.type == "text"
            )
        except Exception as error:
            self._trace(
                tokens_in=0,
                tokens_out=0,
                tool_calls=[],
                latency_ms=elapsed(),
                outcome=f"error:{purpose}",
                error_type=type(error).__name__,
            )
            raise

    def structured_chart_config(self, prompt: str) -> VisualizationConfig:
        schema = VisualizationConfig.model_json_schema()
        wrapped = (
            prompt
            + "\n\nReturn only JSON that validates against this schema:\n"
            + json.dumps(schema)
        )
        raw = self.complete_text(wrapped, purpose="chart_config")
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()
        return VisualizationConfig.model_validate_json(cleaned)


def make_provider(provider: str, *, model: str, trace: TraceSink, run_id: str) -> ProviderAdapter:
    if provider == "openai":
        return OpenAIAdapter(model=model, trace=trace, run_id=run_id)
    if provider == "anthropic":
        return AnthropicAdapter(model=model, trace=trace, run_id=run_id)
    raise ValueError(f"Unsupported provider: {provider}")


def new_run_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4()}"
