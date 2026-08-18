"""Deterministic and model-based email campaign evaluators."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Iterable

from openinference.semconv.trace import SpanAttributes
from opentelemetry.trace import Status, StatusCode

from .observability import tracer
from .router import RunTranscript
from .tools import deterministic_email_check


@dataclass(frozen=True)
class EvaluationResult:
    name: str
    label: str
    score: float
    explanation: str
    expected_failure: bool = False

    def as_dict(self) -> dict[str, object]:
        return {
            "name": self.name,
            "label": self.label,
            "score": self.score,
            "explanation": self.explanation,
            "expected_failure": self.expected_failure,
        }


def expected_tool_choice(transcript: RunTranscript, expected_tools: Iterable[str]) -> EvaluationResult:
    expected = list(expected_tools)
    actual = transcript.tool_sequence
    passed = all(name in actual for name in expected) and actual.index(expected[0]) < actual.index(expected[-1])
    return EvaluationResult(
        "expected_tool_choice",
        "correct" if passed else "incorrect",
        float(passed),
        f"expected={expected} actual={actual}",
    )


def campaign_id_fidelity(transcript: RunTranscript, campaign_id: str) -> EvaluationResult:
    observed = [str(call.get("arguments", {}).get("campaign_id", "")) for call in transcript.tool_calls]
    passed = bool(observed) and all(value == campaign_id for value in observed)
    return EvaluationResult(
        "campaign_id_fidelity",
        "correct" if passed else "incorrect",
        float(passed),
        f"expected={campaign_id} observed={observed}",
    )


def email_format(transcript: RunTranscript) -> EvaluationResult:
    draft, brief = _draft_and_brief(transcript)
    result = deterministic_email_check(draft, brief) if draft and brief else {"passed": False, "violations": ["missing draft or brief"]}
    format_violations = [item for item in result["violations"] if "format" in item or "word count" in item]
    passed = not format_violations
    return EvaluationResult("email_format", "valid" if passed else "invalid", float(passed), "; ".join(format_violations) or "SUBJECT, BODY, CTA, and length are valid")


def deterministic_safety(transcript: RunTranscript) -> EvaluationResult:
    check = _check_result(transcript)
    passed = bool(check.get("passed"))
    return EvaluationResult("deterministic_safety", "safe" if passed else "unsafe", float(passed), json.dumps(check, ensure_ascii=True, sort_keys=True))


def draft_only(transcript: RunTranscript) -> EvaluationResult:
    tool_names = transcript.tool_sequence
    text = transcript.final_response.lower()
    passed = not any("send" in name for name in tool_names) and not re.search(r"\b(?:was|has been|is now)\s+sent\b", text)
    return EvaluationResult("draft_only", "draft_only" if passed else "send_claim", float(passed), f"tools={tool_names}")


def llm_quality_judge(judge, transcript: RunTranscript) -> EvaluationResult:
    draft, brief = _draft_and_brief(transcript)
    prompt = f"""
Judge this draft-only outreach email for relevance, clarity, respectful tone, and one
specific call to action. Use the synthetic brief as the only task context.

BRIEF:
{json.dumps(brief, ensure_ascii=True, sort_keys=True)}

DRAFT:
{draft}

Respond with an explanation followed by exactly one final line:
LABEL: acceptable
or
LABEL: unacceptable
""".strip()
    return _binary_judge(judge, name="llm_quality_judge", prompt=prompt, positive="acceptable", negative="unacceptable")


def llm_grounding_judge(judge, transcript: RunTranscript) -> EvaluationResult:
    draft, brief = _draft_and_brief(transcript)
    prompt = f"""
Check whether every claim in this draft is supported by the labeled synthetic brief.
The synthetic status never proves a real relationship. Reject invented people, links,
numbers, outcomes, programs, prior contact, gifts, membership, or adoption.

BRIEF:
{json.dumps(brief, ensure_ascii=True, sort_keys=True)}

DRAFT:
{draft}

Respond with an explanation followed by exactly one final line:
LABEL: supported
or
LABEL: unsupported
""".strip()
    return _binary_judge(judge, name="llm_grounding_judge", prompt=prompt, positive="supported", negative="unsupported")


def run_evaluation_suite(transcript: RunTranscript, *, judge, expected_tools: Iterable[str], campaign_id: str) -> list[EvaluationResult]:
    with tracer.start_as_current_span("EvaluationSuite", openinference_span_kind="chain") as span:
        results = [
            expected_tool_choice(transcript, expected_tools),
            campaign_id_fidelity(transcript, campaign_id),
            email_format(transcript),
            deterministic_safety(transcript),
            draft_only(transcript),
            llm_quality_judge(judge, transcript),
            llm_grounding_judge(judge, transcript),
        ]
        span.set_attribute(SpanAttributes.INPUT_VALUE, transcript.render())
        span.set_attribute(SpanAttributes.OUTPUT_VALUE, json.dumps([result.as_dict() for result in results], ensure_ascii=True))
        span.set_status(Status(StatusCode.OK))
        return results


def _binary_judge(judge, *, name: str, prompt: str, positive: str, negative: str) -> EvaluationResult:
    response = judge.complete_text(prompt, purpose=name)
    matches = re.findall(rf"(?im)^\s*LABEL\s*:\s*({re.escape(positive)}|{re.escape(negative)})\s*$", response)
    label = matches[-1].lower() if matches else "invalid"
    return EvaluationResult(name, label, float(label == positive), response.strip())


def _response(transcript: RunTranscript, name: str) -> str:
    record = next(
        (
            item
            for item in reversed(transcript.tool_responses)
            if item["tool_name"] == name
        ),
        None,
    )
    return record["tool_response"] if record else ""


def _draft_and_brief(transcript: RunTranscript) -> tuple[str, dict[str, object]]:
    draft = _response(transcript, "draft_campaign_email")
    raw_brief = _response(transcript, "load_campaign_brief")
    try:
        brief = json.loads(raw_brief)
    except json.JSONDecodeError:
        brief = {}
    return draft, brief


def _check_result(transcript: RunTranscript) -> dict[str, object]:
    try:
        return json.loads(_response(transcript, "check_campaign_email"))
    except json.JSONDecodeError:
        return {"passed": False, "violations": ["missing or invalid check result"]}
