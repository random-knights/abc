# Lesson 07: Router And Tool Evaluations

## Source Basis

Implemented from the lesson 7 notebook and transcript. The course keeps the
notebook's tool-call judge, SQL result comparison, clarity judge, entity judge,
and generated-code check. The public runner compiles generated code but does
not execute untrusted model output.

## Run

```powershell
.\.venv\Scripts\python.exe course.py 07 --provider both
```

## Honest Result

The runnable-code evaluator can pass placeholder chart code. Syntax answers
whether code compiles; it does not answer whether the chart represents its
input. `chart_data_fidelity` checks that source values survive into the output
and catches the verified defect on both providers.

## AIEDS

Agent and judge calls append to the same AIEDS JSONL with distinct run IDs and
outcome purposes. This adds the resource cost of evaluation beside the cost of
generation.

## Exercise

Compare `generated_code_compiles` with `chart_data_fidelity`. Record why one is
green and the other is red. That disagreement is the lesson.
