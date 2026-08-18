# Lesson 03: Agent Tool Routing

## Source Basis

Implemented from the lesson 3 notebook and transcript. The code uses one
provider-neutral router, three typed tools, and adapters for OpenAI and
Anthropic.

## Run

```powershell
.\.venv\Scripts\python.exe course.py 03 --provider both
```

The router must select data lookup before analysis or visualization. A single
query may require several router turns and more than one tool call.

## Evidence To Inspect

Check the printed tool sequence, the final response, and
`traces/model_calls.jsonl`. A successful answer is not enough. Confirm that the
lookup output reaches downstream tools and that no unsupported tool was called.

## AIEDS

This lesson establishes one append-only AIEDS row per router or tool-internal
model call. It adds provider, model, tokens, latency, selected tools, outcome,
energy, carbon, and tree-time beside the human-readable transcript.

## Decision

Adopt the provider-neutral seam and typed schemas. Do not trust generated SQL
or chart code without evaluation.
