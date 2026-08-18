# Lesson 06: Evaluation Methods

## Source Basis

Transcript-derived. No notebook was provided for lesson 6.

## Run

```powershell
.\.venv\Scripts\python.exe course.py 06
```

The command prints the evaluation plan. Use code when a property has
deterministic ground truth, an LLM judge for qualitative classification, and
human annotation for calibration and novel failures.

Router evaluation has two separate questions: was the function correct, and
were its parameters correct? Tool evaluation follows the same rule. Evaluate
the whole tool and risky sub-steps such as SQL generation or chart generation.

## AIEDS

This conceptual lesson makes no model call and adds no AIEDS row. Later judge
calls append through the same logger as agent calls, so judge cost is visible.

## Decision

Prefer discrete labels such as `correct` and `incorrect`. Never treat an LLM
judge as deterministic ground truth.
