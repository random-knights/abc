"""Phoenix and OpenInference setup for the lesson 12 span tree."""

from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import urlopen

from openinference.instrumentation import TraceConfig, TracerProvider
from openinference.instrumentation.anthropic import AnthropicInstrumentor
from openinference.instrumentation.openai import OpenAIInstrumentor
from phoenix.otel import register


DEFAULT_COLLECTOR_ENDPOINT = "http://127.0.0.1:6006/v1/traces"
DEFAULT_PROJECT_NAME = "agent-evals-course"


@dataclass(frozen=True)
class TracingState:
    tracer_provider: TracerProvider
    tracer: object
    collector_endpoint: str
    project_name: str
    exporting: bool
    reason: str

    def status_line(self) -> str:
        if self.exporting:
            return (
                "PHOENIX: exporting OpenAI and Anthropic spans to "
                f"{self.collector_endpoint} project={self.project_name}"
            )
        return (
            f"PHOENIX: unavailable at {self.collector_endpoint}; span export disabled "
            f"({self.reason}); AIEDS JSONL remains active"
        )

    def flush(self) -> bool:
        return bool(self.tracer_provider.force_flush(timeout_millis=5000))


def _phoenix_is_reachable(collector_endpoint: str) -> bool:
    parsed = urlsplit(collector_endpoint)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return False
    health_url = urlunsplit((parsed.scheme, parsed.netloc, "/", "", ""))
    try:
        with urlopen(health_url, timeout=0.75) as response:
            return response.status < 500
    except HTTPError as error:
        return error.code < 500
    except (OSError, URLError, ValueError):
        return False


def _setup_tracing() -> TracingState:
    collector_endpoint = os.environ.get(
        "PHOENIX_COLLECTOR_ENDPOINT", DEFAULT_COLLECTOR_ENDPOINT
    )
    project_name = os.environ.get("PHOENIX_PROJECT_NAME", DEFAULT_PROJECT_NAME)
    config = TraceConfig()
    exporting = _phoenix_is_reachable(collector_endpoint)
    reason = "collector did not answer its HTTP health check"

    if exporting:
        try:
            provider = register(
                project_name=project_name,
                endpoint=collector_endpoint,
                batch=False,
                auto_instrument=False,
                verbose=False,
            )
        except Exception as error:
            provider = TracerProvider(config=config)
            exporting = False
            reason = f"registration failed with {type(error).__name__}"
    else:
        provider = TracerProvider(config=config)

    OpenAIInstrumentor().instrument(tracer_provider=provider, config=config)
    AnthropicInstrumentor().instrument(tracer_provider=provider, config=config)
    return TracingState(
        tracer_provider=provider,
        tracer=provider.get_tracer(__name__),
        collector_endpoint=collector_endpoint,
        project_name=project_name,
        exporting=exporting,
        reason=reason,
    )


tracing = _setup_tracing()
tracer = tracing.tracer
