"""Redact provider errors before writing transcripts."""

from __future__ import annotations

import re


KEY_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9_*.-]+"),
    re.compile(r"sk-proj-[A-Za-z0-9_*.-]+"),
    re.compile(r"sk-ant-[A-Za-z0-9_*.-]+"),
]


def sanitize_error(error: Exception) -> str:
    text = f"{type(error).__name__}: {error}"
    for pattern in KEY_PATTERNS:
        text = pattern.sub("[REDACTED_API_KEY]", text)
    text = re.sub(
        r"Incorrect API key provided: \[REDACTED_API_KEY\]\.",
        "Incorrect API key provided.",
        text,
    )
    return text
