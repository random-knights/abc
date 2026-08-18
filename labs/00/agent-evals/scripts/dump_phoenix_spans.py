"""Print the newest OpenAI and Anthropic AgentRun trees from Phoenix."""

from __future__ import annotations

import os
from collections import defaultdict
from datetime import datetime
from urllib.parse import urlsplit, urlunsplit

from phoenix.client import Client


PROJECT = os.environ.get("PHOENIX_PROJECT_NAME", "agent-evals-course")
COLLECTOR = os.environ.get(
    "PHOENIX_COLLECTOR_ENDPOINT", "http://127.0.0.1:6006/v1/traces"
)


def _server_url() -> str:
    configured = os.environ.get("PHOENIX_SERVER_URL")
    if configured:
        return configured.rstrip("/")
    parsed = urlsplit(COLLECTOR)
    return urlunsplit((parsed.scheme, parsed.netloc, "", "", "")).rstrip("/")


def _preview(value: object, limit: int = 240) -> str:
    text = " ".join(str(value).split())
    return text if len(text) <= limit else text[:limit] + " ..."


def _duration_ms(span: dict[str, object]) -> int:
    start = datetime.fromisoformat(str(span["start_time"]).replace("Z", "+00:00"))
    end = datetime.fromisoformat(str(span["end_time"]).replace("Z", "+00:00"))
    return int((end - start).total_seconds() * 1000)


def _print_tree(
    span: dict[str, object],
    children: dict[str | None, list[dict[str, object]]],
    depth: int = 0,
) -> None:
    indent = "  " * depth
    print(
        f"{indent}- {span['name']} kind={span['span_kind']} "
        f"status={span['status_code']} duration_ms={_duration_ms(span)}"
    )
    attributes = span.get("attributes", {})
    if isinstance(attributes, dict):
        for key in ("input.value", "output.value"):
            if key in attributes:
                print(f"{indent}  {key}={_preview(attributes[key])}")
    span_id = str(span["context"]["span_id"])
    for child in sorted(children.get(span_id, []), key=lambda item: item["start_time"]):
        _print_tree(child, children, depth + 1)


def main() -> None:
    spans = Client(base_url=_server_url()).spans.get_spans(
        project_identifier=PROJECT, limit=500
    )
    by_trace: dict[str, list[dict[str, object]]] = defaultdict(list)
    for span in spans:
        by_trace[str(span["context"]["trace_id"])].append(span)

    newest: dict[str, tuple[str, dict[str, object]]] = {}
    for trace_id, trace_spans in by_trace.items():
        roots = [span for span in trace_spans if span["name"] == "AgentRun"]
        if not roots:
            continue
        root = max(roots, key=lambda item: item["start_time"])
        provider = str(root.get("attributes", {}).get("llm.provider", "unknown"))
        current = newest.get(provider)
        if current is None or root["start_time"] > current[1]["start_time"]:
            newest[provider] = (trace_id, root)

    for provider in ("openai", "anthropic"):
        if provider not in newest:
            print(f"{provider.upper()} TRACE: not found in project {PROJECT}")
            continue
        trace_id, root = newest[provider]
        children: dict[str | None, list[dict[str, object]]] = defaultdict(list)
        for span in by_trace[trace_id]:
            children[span.get("parent_id")].append(span)
        print(f"{provider.upper()} TRACE {trace_id}")
        _print_tree(root, children)


if __name__ == "__main__":
    main()
