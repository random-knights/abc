# Lesson 05: Span Tracing

Start Phoenix, then run `course.py 05 --provider both` and
`scripts\dump_phoenix_spans.py`. Each `AgentRun` contains router turns, provider
LLM calls, tool spans, the nested draft model call, and the deterministic check.

The span tree shows where a brief entered, where prose was generated, and where
the safety decision was made. AIEDS records energy and carbon beside that tree.
