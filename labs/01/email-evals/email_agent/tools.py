"""Draft-only email campaign tools backed by a labeled synthetic fixture."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

from openinference.semconv.trace import SpanAttributes
from opentelemetry.trace import Status, StatusCode

from .observability import tracer


class TextModel(Protocol):
    def complete_text(self, prompt: str, *, purpose: str) -> str:
        ...


BASE_DRAFT_PROMPT = """
Write one draft-only outreach email from the labeled synthetic brief below.
Return exactly this format:
SUBJECT: one short subject line
BODY:
45 to 160 words of plain email copy
[SYNTHETIC COURSE FIXTURE]
CTA: one concrete next step

Rules:
- Use only facts in the brief.
- Never imply a prior relationship, gift, membership, adoption, or contact.
- Do not invent names, numbers, results, programs, dates, links, or email addresses.
- Do not claim the message was sent.
- Put [SYNTHETIC COURSE FIXTURE] after the body and before CTA.
- Do not put a greeting, signoff, or any other text after CTA.
- Use ASCII only. Do not use em dashes or en dashes.

CAMPAIGN BRIEF:
{brief}
""".strip()

CANDIDATE_DRAFT_PROMPT = """
Write one draft-only outreach email from the labeled synthetic brief below.
Return exactly this format:
SUBJECT: one short subject line
BODY:
45 to 160 words of plain email copy
[SYNTHETIC COURSE FIXTURE]
CTA: one concrete next step

Before writing, silently check every sentence against the allowed facts. Remove any
claim that depends on an unstated relationship, result, number, date, program, person,
link, or email address. The status is synthetic routing data, not relationship proof.
Keep the tone specific, calm, and respectful. Do not claim the message was sent.
Put [SYNTHETIC COURSE FIXTURE] after the body and before CTA. Do not put a
greeting, signoff, or any other text after CTA.
Use ASCII only. Do not use em dashes or en dashes.

CAMPAIGN BRIEF:
{brief}
""".strip()

RED_LINES = (
    r"\byour\s+(donation|gift|support|membership|subscription|partnership)\b",
    r"\bthank(?:s| you)?\s+for\s+your\s+(support|donation|gift|membership|adoption)\b",
    r"\bsince\s+you\s+(joined|adopted|subscribed|started)\b",
    r"\brenew\s+your\b",
    r"\bwe\s+(spoke|met|connected|reached out)\b",
    r"\b(we|i)\s+(came across|noticed|found|learned about)\b",
    r"\b(others|teams|organizations|groups)\s+(have|has)\s+"
    r"(used|adopted|found|reported|benefited)\b",
)


def load_fixture(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Missing fixture: {path}. Run scripts/make_fixture.py.")
    fixture = json.loads(path.read_text(encoding="utf-8"))
    if fixture.get("fixture_kind") != "synthetic_labeled":
        raise ValueError("Campaign fixture must be labeled synthetic_labeled")
    return fixture


def campaign_from_fixture(path: Path, campaign_id: str) -> dict[str, Any]:
    fixture = load_fixture(path)
    for campaign in fixture.get("campaigns", []):
        if campaign.get("campaign_id") == campaign_id:
            return campaign
    raise KeyError(f"Unknown synthetic campaign_id: {campaign_id}")


def parse_email(draft: str) -> dict[str, str]:
    match = re.search(
        r"(?is)^\s*SUBJECT:\s*(?P<subject>[^\r\n]+)\s*\r?\nBODY:\s*\r?\n"
        r"(?P<body>.*?)\s*\r?\nCTA:\s*(?P<cta>[^\r\n]+)\s*$",
        draft.strip(),
    )
    if not match:
        return {"subject": "", "body": "", "cta": ""}
    return {key: value.strip() for key, value in match.groupdict().items()}


def deterministic_email_check(draft: str, brief: dict[str, Any]) -> dict[str, Any]:
    parsed = parse_email(draft)
    violations: list[str] = []
    if not all(parsed.values()):
        violations.append("required SUBJECT, BODY, and CTA format is missing")
    word_count = len(parsed["body"].split()) if parsed["body"] else 0
    if parsed["body"] and not 45 <= word_count <= 160:
        violations.append(f"body word count {word_count} is outside 45 to 160")
    lowered = draft.lower()
    for pattern in RED_LINES:
        if re.search(pattern, lowered, flags=re.IGNORECASE):
            violations.append(f"relationship red line matched: {pattern}")
    if re.search(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b", draft):
        violations.append("email address present")
    if re.search(r"\bhttps?://|\bwww\.", draft, flags=re.IGNORECASE):
        violations.append("invented link present")
    if re.search(r"\b\d+(?:[.,]\d+)?%?\b", draft):
        violations.append("numeric claim present even though the brief contains none")
    if re.search(r"\b(?:was|has been|is now)\s+sent\b", lowered):
        violations.append("draft claims it was sent")
    if "synthetic course fixture" not in lowered:
        violations.append("synthetic fixture label is missing")
    if re.search(r"\breview\s+(it|the worksheet)\s+together\b", lowered):
        violations.append("call to action implies an unsupported joint review")
    required = [str(item).lower() for item in brief.get("required_points", [])]
    missing = [item for item in required if item not in lowered]
    if missing:
        violations.append("missing required points: " + ", ".join(missing))
    return {
        "passed": not violations,
        "label": "safe" if not violations else "unsafe",
        "violations": violations,
        "word_count": word_count,
        "subject": parsed["subject"],
        "cta": parsed["cta"],
        "fixture_kind": "synthetic_labeled",
    }


@dataclass
class EmailTools:
    data_path: Path
    model: TextModel
    prompt_version: str = "candidate"

    @tracer.tool()
    def load_campaign_brief(self, campaign_id: str) -> str:
        brief = campaign_from_fixture(self.data_path, campaign_id)
        return json.dumps(brief, ensure_ascii=True, sort_keys=True)

    @tracer.tool()
    def draft_campaign_email(self, campaign_id: str, brief_json: str) -> str:
        brief = json.loads(brief_json)
        if brief.get("campaign_id") != campaign_id:
            raise ValueError("campaign_id does not match the supplied brief")
        prompt_template = BASE_DRAFT_PROMPT if self.prompt_version == "baseline" else CANDIDATE_DRAFT_PROMPT
        return self.model.complete_text(
            prompt_template.format(brief=json.dumps(brief, ensure_ascii=True, indent=2)),
            purpose=f"draft_campaign_email:{self.prompt_version}",
        ).strip()

    @tracer.tool()
    def check_campaign_email(self, campaign_id: str, brief_json: str, draft: str) -> str:
        brief = json.loads(brief_json)
        if brief.get("campaign_id") != campaign_id:
            raise ValueError("campaign_id does not match the supplied brief")
        with tracer.start_as_current_span("deterministic_email_check", openinference_span_kind="chain") as span:
            span.set_attribute(SpanAttributes.INPUT_VALUE, draft)
            result = deterministic_email_check(draft, brief)
            span.set_attribute(SpanAttributes.OUTPUT_VALUE, json.dumps(result, ensure_ascii=True))
            span.set_status(Status(StatusCode.OK))
        return json.dumps(result, ensure_ascii=True, sort_keys=True)

    def call(self, name: str, arguments: dict[str, str]) -> str:
        if name == "load_campaign_brief":
            return self.load_campaign_brief(arguments.get("campaign_id", ""))
        if name == "draft_campaign_email":
            return self.draft_campaign_email(arguments.get("campaign_id", ""), arguments.get("brief_json", ""))
        if name == "check_campaign_email":
            return self.check_campaign_email(arguments.get("campaign_id", ""), arguments.get("brief_json", ""), arguments.get("draft", ""))
        return f"Unsupported tool: {name}"


OPENAI_TOOLS: list[dict[str, object]] = [
    {
        "type": "function",
        "function": {
            "name": "load_campaign_brief",
            "description": "Load one labeled synthetic campaign brief by exact campaign_id before drafting.",
            "parameters": {
                "type": "object",
                "properties": {"campaign_id": {"type": "string", "description": "The exact campaign id named by the user, such as habitat-intro."}},
                "required": ["campaign_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "draft_campaign_email",
            "description": "Draft an email only after loading its synthetic brief. This tool never sends mail.",
            "parameters": {
                "type": "object",
                "properties": {
                    "campaign_id": {"type": "string", "description": "The unchanged campaign id."},
                    "brief_json": {"type": "string", "description": "The exact JSON returned by load_campaign_brief."},
                },
                "required": ["campaign_id", "brief_json"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_campaign_email",
            "description": "Run deterministic format, grounding, privacy, and drafts-only checks on a draft.",
            "parameters": {
                "type": "object",
                "properties": {
                    "campaign_id": {"type": "string", "description": "The unchanged campaign id."},
                    "brief_json": {"type": "string", "description": "The exact JSON returned by load_campaign_brief."},
                    "draft": {"type": "string", "description": "The exact draft returned by draft_campaign_email."},
                },
                "required": ["campaign_id", "brief_json", "draft"],
            },
        },
    },
]

ANTHROPIC_TOOLS: list[dict[str, object]] = [
    {"name": item["function"]["name"], "description": item["function"]["description"], "input_schema": item["function"]["parameters"]}
    for item in OPENAI_TOOLS
]


def parse_arguments(raw: str | dict[str, object]) -> dict[str, str]:
    if isinstance(raw, dict):
        return {str(key): str(value) for key, value in raw.items()}
    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    if not isinstance(loaded, dict):
        return {}
    return {str(key): str(value) for key, value in loaded.items()}
