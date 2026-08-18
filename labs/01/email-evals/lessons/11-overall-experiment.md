# Lesson 11: Overall Email Experiment

Run `course.py 11 --provider both`. The experiment compares a baseline drafting
prompt with a candidate that explicitly checks every sentence against the brief.
Both versions use the same fixtures, providers, tools, and evaluators.

Phoenix records expected tools, campaign id, format, deterministic safety,
draft-only behavior, quality, and grounding. Use `--full` for all campaign cases.
