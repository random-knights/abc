"""Shared email course runner for both provider adapters."""

from __future__ import annotations

import os
from pathlib import Path

from openinference.semconv.trace import SpanAttributes
from opentelemetry.trace import Status, StatusCode

from .observability import tracer, tracing
from .providers import make_provider, new_run_id
from .router import RunTranscript, run_agent
from .tools import EmailTools
from .tracing import TraceSink


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "campaign_fixture.json"
OUTPUT_DIR = ROOT / "outputs"
TRACE_PATH = Path(os.environ.get("AIEDS_TRACE_PATH", str(ROOT / "traces" / "model_calls.jsonl"))).expanduser()
EXPERIMENT_PATH = Path(os.environ.get("EXPERIMENT_RESULTS_PATH", str(OUTPUT_DIR / "experiment_results.jsonl"))).expanduser()

OPENAI_MODEL = "gpt-4o-mini"
OPENAI_JUDGE_MODEL = "gpt-4o"
ANTHROPIC_MODEL = "claude-sonnet-5"
ANTHROPIC_JUDGE_MODEL = "claude-sonnet-5"

DEFAULT_QUERY = "Draft the habitat-intro campaign. Load its brief, draft the email, check it, and return the checked draft."


def model_for(provider: str, *, judge: bool = False) -> str:
    if provider == "openai":
        default = OPENAI_JUDGE_MODEL if judge else OPENAI_MODEL
        return os.environ.get("OPENAI_JUDGE_MODEL" if judge else "OPENAI_MODEL", default)
    if provider == "anthropic":
        default = ANTHROPIC_JUDGE_MODEL if judge else ANTHROPIC_MODEL
        return os.environ.get("ANTHROPIC_JUDGE_MODEL" if judge else "ANTHROPIC_MODEL", default)
    raise ValueError(f"Unsupported provider: {provider}")


def require_provider_key(provider: str) -> None:
    name = "OPENAI_API_KEY" if provider == "openai" else "ANTHROPIC_API_KEY"
    if not os.environ.get(name):
        raise RuntimeError(f"{name} is not set in the environment")


def make_trace_sink() -> TraceSink:
    return TraceSink(
        TRACE_PATH,
        source=os.environ.get("AIEDS_SOURCE", "email-evals-course"),
        cwd_label=os.environ.get("AIEDS_CWD_LABEL", "email-evals-course"),
    )


def run_query(provider_name: str, query: str, *, trace: TraceSink, prefix: str, prompt_version: str = "candidate") -> RunTranscript:
    require_provider_key(provider_name)
    model = model_for(provider_name)
    with tracer.start_as_current_span("AgentRun", openinference_span_kind="agent") as agent_span:
        agent_span.set_attribute(SpanAttributes.INPUT_VALUE, query)
        agent_span.set_attribute(SpanAttributes.INPUT_MIME_TYPE, "text/plain")
        agent_span.set_attribute(SpanAttributes.LLM_PROVIDER, provider_name)
        agent_span.set_attribute(SpanAttributes.LLM_MODEL_NAME, model)
        provider = make_provider(provider_name, model=model, trace=trace, run_id=new_run_id(prefix))
        transcript = run_agent(query=query, provider=provider, tools=EmailTools(DATA_PATH, provider, prompt_version=prompt_version))
        agent_span.set_attribute(SpanAttributes.OUTPUT_VALUE, transcript.render())
        agent_span.set_attribute(SpanAttributes.OUTPUT_MIME_TYPE, "text/plain")
        agent_span.set_status(Status(StatusCode.ERROR if transcript.error else StatusCode.OK, transcript.error or ""))
        return transcript


def make_judge(provider_name: str, *, trace: TraceSink, prefix: str):
    require_provider_key(provider_name)
    return make_provider(provider_name, model=model_for(provider_name, judge=True), trace=trace, run_id=new_run_id(prefix))


def provider_names(selection: str) -> tuple[str, ...]:
    if selection == "both":
        return ("openai", "anthropic")
    if selection in {"openai", "anthropic"}:
        return (selection,)
    raise ValueError(f"Unsupported provider selection: {selection}")


def flush_tracing() -> bool:
    return tracing.flush()
