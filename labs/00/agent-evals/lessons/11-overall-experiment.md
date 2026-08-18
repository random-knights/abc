# Lesson 11: Overall Experiment

## Source Basis

Implemented from the lesson 11 notebook and transcript. The notebook's hidden
helper functions were reconstructed as explicit package code so this directory
runs without external course files.

## Run

```powershell
.\.venv\Scripts\python.exe course.py 11 --provider both
```

Use `--full` to run all included cases. The default verification case exercises
lookup and visualization against both SQL prompt versions.

The experiment records router ground truth, an LLM tool-call judge, SQL result
ground truth, clarity, entity correctness, code compilation, and chart data
fidelity. Phoenix receives one dataset and experiment per provider and version.

## Honest Result

The source methodology's runnable-code evaluator does not catch placeholder
chart data. The added deterministic fidelity evaluator does. This does not
rewrite the source result; it exposes the blind spot and measures the property
the artifact actually needs.

## AIEDS

Every baseline, candidate, and judge call appends. Compare quality changes with
tokens, latency, energy, carbon, and tree-time before recommending v2.
