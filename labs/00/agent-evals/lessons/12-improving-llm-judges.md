# Lesson 12: Improving LLM Judges

## Source Basis

Transcript-derived. No notebook was provided for lesson 12.

## Run

```powershell
.\.venv\Scripts\python.exe course.py 12 --provider both
```

The experiment compares a baseline tool-call judge with a few-shot prompt. Both
are scored against deterministic labels that include a wrong function and a
correct function with a wrong parameter.

Use deterministic labels to measure judge agreement. Improve the prompt or
judge model, then rerun the same cases. Semantic similarity is appropriate when
ground truth is meaning rather than an exact discrete label.

## AIEDS

Judge experiments are model workloads. Their AIEDS rows make the cost of judge
calibration explicit instead of treating evaluation as free.

## Decision

Scale a judge only after measuring it against ground truth. Keep human review
for disagreement cases and newly observed failure classes.
