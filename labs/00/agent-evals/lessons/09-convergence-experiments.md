# Lesson 09: Convergence Experiments

## Source Basis

Implemented from the lesson 9 notebook and transcript using the current Phoenix
client experiment API.

## Run

```powershell
.\.venv\Scripts\python.exe course.py 09 --provider both
```

The runner sends paraphrases of one request through each provider, records path
length, selects the shortest observed path, and evaluates every run against it.
With Phoenix live, the dataset, task runs, and convergence evaluations appear
under Experiments. Without Phoenix, the same records append locally and the
terminal states that fallback.

Use `--full` for the expanded question set.

## AIEDS

The experiment adds cross-run path scores. AIEDS adds per-call resource impact,
which lets you compare a path score with actual model work instead of assuming
step count and impact are identical.
