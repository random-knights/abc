"""Compatibility entry point for the dual-provider traced agent lab."""

from course import lesson_05
from email_agent.runner import flush_tracing


if __name__ == "__main__":
    lesson_05("both")
    print(f"PHOENIX_FLUSHED={flush_tracing()}")
