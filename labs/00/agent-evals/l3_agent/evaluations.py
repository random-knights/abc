"""Code and model evaluators used by lessons 6 through 13."""

from __future__ import annotations

import ast
import json
import re
from dataclasses import asdict, dataclass
from decimal import Decimal, InvalidOperation
from typing import Iterable

from openinference.semconv.trace import SpanAttributes
from opentelemetry.trace import Status, StatusCode

from .observability import tracer
from .router import RunTranscript
from .tools import OPENAI_TOOLS


@dataclass(frozen=True)
class EvaluationResult:
    name: str
    label: str
    score: float
    explanation: str
    expected_failure: bool = False

    def as_dict(self) -> dict[str, object]:
        return asdict(self)


def expected_tool_choice(
    transcript: RunTranscript,
    expected_tools: Iterable[str],
) -> EvaluationResult:
    expected = set(expected_tools)
    actual = set(transcript.tool_sequence)
    passed = expected.issubset(actual)
    return EvaluationResult(
        name="expected_tool_choice",
        label="correct" if passed else "incorrect",
        score=float(passed),
        explanation=f"expected subset={sorted(expected)} actual={transcript.tool_sequence}",
    )


def generated_code_compiles(transcript: RunTranscript) -> EvaluationResult:
    code = _tool_response(transcript, "generate_visualization")
    if code is None:
        return EvaluationResult(
            name="generated_code_compiles",
            label="not_applicable",
            score=1.0,
            explanation="The run did not call generate_visualization.",
        )
    try:
        tree = ast.parse(code)
        compile(tree, "<generated-chart>", "exec")
    except (SyntaxError, ValueError, TypeError) as error:
        return EvaluationResult(
            name="generated_code_compiles",
            label="not_runnable",
            score=0.0,
            explanation=f"{type(error).__name__}: {error}",
        )
    return EvaluationResult(
        name="generated_code_compiles",
        label="runnable",
        score=1.0,
        explanation=(
            "The code parses and compiles. It was not executed because model-generated "
            "code is not a trusted artifact."
        ),
    )


def chart_data_fidelity(transcript: RunTranscript) -> EvaluationResult:
    call = _tool_call(transcript, "generate_visualization")
    code = _tool_response(transcript, "generate_visualization")
    if call is None or code is None:
        return EvaluationResult(
            name="chart_data_fidelity",
            label="not_applicable",
            score=1.0,
            explanation="The run did not call generate_visualization.",
        )
    source_numbers = _numbers(str(call["arguments"].get("data", "")))
    output_numbers = _numbers(code)
    missing = sorted(source_numbers - output_numbers)
    passed = bool(source_numbers) and not missing
    explanation = (
        "Every numeric value from the tool input appears in the generated chart code."
        if passed
        else f"Generated code omitted source values: {missing}"
    )
    return EvaluationResult(
        name="chart_data_fidelity",
        label="faithful" if passed else "placeholder_data",
        score=float(passed),
        explanation=explanation,
        expected_failure=not passed,
    )


def sql_result_matches(
    transcript: RunTranscript,
    expected_result: str,
) -> EvaluationResult:
    actual = _tool_response(transcript, "lookup_sales_data")
    passed = actual is not None and _numbers(actual) == _numbers(expected_result)
    return EvaluationResult(
        name="sql_result_matches",
        label="correct" if passed else "incorrect",
        score=float(passed),
        explanation=(
            "Numeric SQL output matches the expected result."
            if passed
            else "Numeric SQL output differs from the expected result."
        ),
    )


def llm_tool_call_judge(judge, transcript: RunTranscript) -> EvaluationResult:
    prompt = f"""
Evaluate whether the tool calls correctly answer the user's request.
Judge both function choice and extracted parameters.

User request:
{transcript.query}

Available tools:
{json.dumps(OPENAI_TOOLS, ensure_ascii=True)}

Tool calls:
{json.dumps(transcript.tool_calls, ensure_ascii=True)}

Respond with an explanation followed by exactly one final line:
LABEL: correct
or
LABEL: incorrect
""".strip()
    return _binary_judge(
        judge,
        name="llm_tool_call_judge",
        prompt=prompt,
        positive="correct",
        negative="incorrect",
    )


def llm_clarity_judge(judge, transcript: RunTranscript) -> EvaluationResult:
    prompt = f"""
Evaluate whether the answer is precise, coherent, and directly addresses the query.

Query:
{transcript.query}

Answer:
{transcript.final_response}

Respond with an explanation followed by exactly one final line:
LABEL: clear
or
LABEL: unclear
""".strip()
    return _binary_judge(
        judge,
        name="llm_clarity_judge",
        prompt=prompt,
        positive="clear",
        negative="unclear",
    )


def llm_entity_judge(judge, transcript: RunTranscript) -> EvaluationResult:
    evidence = "\n".join(
        record["tool_response"] for record in transcript.tool_responses
    )
    prompt = f"""
Evaluate whether named entities and numeric claims in the answer are supported by the
tool evidence. Do not award correctness for invented entities or values.

Query:
{transcript.query}

Tool evidence:
{evidence}

Answer:
{transcript.final_response}

Respond with an explanation followed by exactly one final line:
LABEL: correct
or
LABEL: incorrect
""".strip()
    return _binary_judge(
        judge,
        name="llm_entity_judge",
        prompt=prompt,
        positive="correct",
        negative="incorrect",
    )


def run_evaluation_suite(
    transcript: RunTranscript,
    *,
    judge,
    expected_tools: Iterable[str],
    expected_sql_result: str | None = None,
) -> list[EvaluationResult]:
    with tracer.start_as_current_span(
        "EvaluationSuite", openinference_span_kind="chain"
    ) as span:
        span.set_attribute(SpanAttributes.INPUT_VALUE, transcript.render())
        results = [
            expected_tool_choice(transcript, expected_tools),
            llm_tool_call_judge(judge, transcript),
            generated_code_compiles(transcript),
            chart_data_fidelity(transcript),
            llm_clarity_judge(judge, transcript),
            llm_entity_judge(judge, transcript),
        ]
        if expected_sql_result is not None:
            results.append(sql_result_matches(transcript, expected_sql_result))
        span.set_attribute(
            SpanAttributes.OUTPUT_VALUE,
            json.dumps([result.as_dict() for result in results], ensure_ascii=True),
        )
        span.set_status(Status(StatusCode.OK))
        return results


def _binary_judge(
    judge,
    *,
    name: str,
    prompt: str,
    positive: str,
    negative: str,
) -> EvaluationResult:
    response = judge.complete_text(prompt, purpose=name)
    matches = re.findall(
        rf"(?im)^\s*LABEL\s*:\s*({re.escape(positive)}|{re.escape(negative)})\s*$",
        response,
    )
    label = matches[-1].lower() if matches else "invalid"
    return EvaluationResult(
        name=name,
        label=label,
        score=float(label == positive),
        explanation=response.strip(),
    )


def _tool_call(transcript: RunTranscript, name: str) -> dict[str, object] | None:
    return next((record for record in transcript.tool_calls if record["name"] == name), None)


def _tool_response(transcript: RunTranscript, name: str) -> str | None:
    record = next(
        (record for record in transcript.tool_responses if record["tool_name"] == name),
        None,
    )
    return record["tool_response"] if record else None


def _numbers(value: str) -> set[str]:
    normalized: set[str] = set()
    for raw in re.findall(r"-?\d+(?:\.\d+)?", value):
        try:
            normalized.add(format(Decimal(raw).normalize(), "f"))
        except InvalidOperation:
            continue
    return normalized
