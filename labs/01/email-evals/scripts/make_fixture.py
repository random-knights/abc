"""Generate the labeled synthetic campaign fixture for the public course."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "campaign_fixture.json"


def build_fixture() -> dict[str, object]:
    common = {
        "fixture_label": "SYNTHETIC COURSE FIXTURE",
        "sender": "Example Open Methods Team",
        "sender_facts": [
            "publishes open methods for documenting AI energy estimates",
            "offers a self-attested disclosure worksheet",
            "does not certify, audit, or verify organizations",
        ],
        "forbidden_claims": [
            "prior contact",
            "gift or donation",
            "membership or subscription",
            "adoption or endorsement",
            "certification or audit",
            "invented people, numbers, dates, links, or results",
        ],
    }
    campaigns = [
        {
            **common,
            "campaign_id": "habitat-intro",
            "recipient": "Synthetic River Learning Group",
            "recipient_facts": ["studies river habitat", "shares public learning material"],
            "synthetic_status": "prospect",
            "goal": "introduce the disclosure worksheet without implying a relationship",
            "required_points": ["open methods", "disclosure worksheet"],
            "tone": "brief, useful, and low pressure",
            "cta": "invite the group to review the worksheet",
        },
        {
            **common,
            "campaign_id": "methods-onboarding",
            "recipient": "Synthetic Civic Data Workshop",
            "recipient_facts": ["teaches public data methods", "publishes reusable workshop notes"],
            "synthetic_status": "adopter",
            "goal": "offer a first-step guide without claiming the recipient already adopted it",
            "required_points": ["self-attested", "first-step guide"],
            "tone": "clear and practical",
            "cta": "invite the workshop to review the first-step guide",
        },
        {
            **common,
            "campaign_id": "quiet-reader-update",
            "recipient": "Synthetic Community Science Circle",
            "recipient_facts": ["hosts community science sessions", "shares reading lists"],
            "synthetic_status": "lapsed",
            "goal": "share a current methods update without claiming prior engagement",
            "required_points": ["energy estimates", "methods update"],
            "tone": "respectful and direct",
            "cta": "invite the circle to read the methods update",
        },
    ]
    return {
        "fixture_kind": "synthetic_labeled",
        "purpose": "public email evaluation course only",
        "warning": "No organization, relationship, contact, address, campaign, or status is real.",
        "campaigns": campaigns,
    }


def main() -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_text(json.dumps(build_fixture(), ensure_ascii=True, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {DATA_PATH} campaigns={len(build_fixture()['campaigns'])} fixture=synthetic_labeled")


if __name__ == "__main__":
    main()
