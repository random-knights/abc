# Lesson 10: Evaluation-Driven Development

## Source Basis

Transcript-derived. No notebook was provided for lesson 10.

## Run

```powershell
.\.venv\Scripts\python.exe course.py 10
```

Hold the dataset and evaluators fixed. Change one prompt, tool description,
router rule, or model. Then compare experiment results. Add production failures
to the dataset after review so the suite reflects real use.

The course's lesson 11 experiment changes only the SQL generation prompt between
v1 and v2. The chart defect remains unchanged, which prevents an unrelated
prompt edit from being credited with fixing it.

## AIEDS

This planning lesson makes no model calls. The experiment runner records AIEDS
for both baseline and candidate so efficiency regressions remain visible beside
quality scores.
