"""Phoenix-backed experiments with a local fallback."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Iterable
from urllib.parse import urlsplit, urlunsplit

from phoenix.client import Client

from .observability import tracing
from .runner import EXPERIMENT_PATH


@dataclass(frozen=True)
class CourseExample:
    input: dict[str, Any]
    expected: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)


def server_url() -> str:
    configured = os.environ.get("PHOENIX_SERVER_URL")
    if configured:
        return configured.rstrip("/")
    parsed = urlsplit(tracing.collector_endpoint)
    return urlunsplit((parsed.scheme, parsed.netloc, "", "", "")).rstrip("/")


def run_course_experiment(
    *,
    name: str,
    description: str,
    examples: Iterable[CourseExample],
    task: Callable[..., dict[str, Any]],
    evaluators: dict[str, Callable[..., dict[str, Any]]],
) -> dict[str, Any]:
    example_list = list(examples)
    if tracing.exporting:
        client = Client(base_url=server_url())
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        dataset = client.datasets.create_dataset(
            name=f"{name}-{timestamp}",
            inputs=[example.input for example in example_list],
            outputs=[example.expected for example in example_list],
            metadata=[example.metadata for example in example_list],
            dataset_description=description,
            timeout=30,
        )
        experiment = client.experiments.run_experiment(
            dataset=dataset,
            task=task,
            evaluators=evaluators,
            experiment_name=name,
            experiment_description=description,
            retries=0,
            timeout=120,
            print_summary=True,
        )
        summary = {
            "backend": "phoenix",
            "experimentId": experiment["experiment_id"],
            "datasetId": experiment["dataset_id"],
            "taskRuns": experiment["task_runs"],
            "evaluationRuns": [
                {
                    "experimentRunId": run.experiment_run_id,
                    "name": run.name,
                    "error": run.error,
                    "result": run.result,
                }
                for run in experiment["evaluation_runs"]
            ],
        }
    else:
        task_runs: list[dict[str, Any]] = []
        evaluation_runs: list[dict[str, Any]] = []
        for example in example_list:
            output = task(input=example.input)
            task_runs.append({"input": example.input, "output": output})
            for evaluator_name, evaluator in evaluators.items():
                result = evaluator(
                    input=example.input,
                    output=output,
                    expected=example.expected,
                    metadata=example.metadata,
                )
                evaluation_runs.append(
                    {"name": evaluator_name, "result": result, "error": None}
                )
        summary = {
            "backend": "local",
            "taskRuns": task_runs,
            "evaluationRuns": evaluation_runs,
        }
    record = {
        "tsUtc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "name": name,
        **summary,
    }
    EXPERIMENT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with EXPERIMENT_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=True, default=str) + "\n")
    return record
