"""Run the L3 lab and provider comparison."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from l3_agent.providers import make_provider, new_run_id
from l3_agent.router import run_agent
from l3_agent.tools import LabTools
from l3_agent.tracing import TraceSink


ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "store_sales_fixture.parquet"
TRACE_PATH = ROOT / "traces" / "model_calls.jsonl"
OUTPUT_DIR = ROOT / "outputs"
OPENAI_MODEL = "gpt-4o-mini"
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")
QUERY = (
    "Show me the code for a bar chart of total sales by store in November 2021 "
    "and tell me what trends you see."
)


def require_env(name: str) -> None:
    if not os.environ.get(name):
        raise RuntimeError(f"{name} is not set in the environment")


def run_one(provider_name: str, model: str, trace: TraceSink, prefix: str):
    run_id = new_run_id(prefix)
    provider = make_provider(provider_name, model=model, trace=trace, run_id=run_id)
    tools = LabTools(DATA_PATH, provider)
    return run_agent(query=QUERY, provider=provider, tools=tools)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    require_env("OPENAI_API_KEY")
    require_env("ANTHROPIC_API_KEY")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    trace = TraceSink(TRACE_PATH)

    phase1 = run_one("openai", OPENAI_MODEL, trace, "phase1-openai")
    (OUTPUT_DIR / "phase1_openai_transcript.txt").write_text(
        phase1.render(),
        encoding="utf-8",
    )

    phase2_openai = run_one("openai", OPENAI_MODEL, trace, "phase2-openai")
    phase2_anthropic = run_one("anthropic", ANTHROPIC_MODEL, trace, "phase2-anthropic")
    comparison = "\n\n".join(
        [
            "OPENAI RUN",
            phase2_openai.render(),
            "ANTHROPIC RUN",
            phase2_anthropic.render(),
            "TOOL SEQUENCES",
            f"openai: {phase2_openai.tool_sequence}",
            f"anthropic: {phase2_anthropic.tool_sequence}",
        ]
    )
    (OUTPUT_DIR / "phase2_provider_comparison.txt").write_text(
        comparison,
        encoding="utf-8",
    )
    print("PHASE 1 TRANSCRIPT")
    print(phase1.render())
    print()
    print("PHASE 2 COMPARISON")
    print(comparison)
    print()
    print(f"TRACE_JSONL={TRACE_PATH}")


if __name__ == "__main__":
    main()
