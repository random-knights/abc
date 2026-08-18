# Agent Evals Course

This directory is the course. It contains the fixture, dual-provider agent,
Phoenix tracing, evaluators, experiments, monitoring gate, and lesson notes.
Nothing elsewhere in the repository is required to run it.

## Setup

Use Python 3.11. From this directory:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe scripts\make_fixture.py
```

Set keys in the terminal environment. Do not put them in a file in this
directory:

```powershell
$env:OPENAI_API_KEY = "your key"
$env:ANTHROPIC_API_KEY = "your key"
```

The OpenAI course path is pinned to `gpt-4o-mini`; its LLM judge is pinned to
`gpt-4o`. The Anthropic path is pinned to `claude-sonnet-5`. Model environment
overrides exist for controlled experiments, but baseline course evidence uses
those pins.

## Start Phoenix

In a second terminal, from this directory:

```powershell
.\.venv\Scripts\phoenix.exe serve
```

Open `http://127.0.0.1:6006`. Traces use
`http://127.0.0.1:6006/v1/traces` and project `agent-evals-course` by default.
Change them with `PHOENIX_COLLECTOR_ENDPOINT`, `PHOENIX_SERVER_URL`, and
`PHOENIX_PROJECT_NAME`.

If Phoenix is down, the agent still runs. The terminal says span export is
disabled, and AIEDS JSONL continues to append. Experiments use a local fallback
instead of silently disappearing.

## Follow The Course

Run each lesson in order:

```powershell
.\.venv\Scripts\python.exe course.py 03 --provider both
.\.venv\Scripts\python.exe course.py 05 --provider both
.\.venv\Scripts\python.exe course.py 06
.\.venv\Scripts\python.exe course.py 07 --provider both
.\.venv\Scripts\python.exe course.py 08 --provider both
.\.venv\Scripts\python.exe course.py 09 --provider both
.\.venv\Scripts\python.exe course.py 10
.\.venv\Scripts\python.exe course.py 11 --provider both
.\.venv\Scripts\python.exe course.py 12 --provider both
.\.venv\Scripts\python.exe course.py 13
```

Use `--full` on lessons 08, 09, and 11 to expand their datasets after the
short verification path is green. `course.py all --provider both` runs the
short end-to-end sequence and makes paid model calls.

## The Running Defect

`create_chart` receives real rows but its prompt omits those rows. Both
providers can therefore emit runnable chart code with placeholder data. The
course keeps that verified defect visible:

- lesson 05 locates it in the `create_chart` span;
- lesson 07 shows that a runnable-code evaluator passes it;
- lesson 11 adds `chart_data_fidelity`, which fails it;
- lesson 13 turns the failure into a monitoring gate.

This is the central result: an evaluator can be green and still measure the
wrong property.

## AIEDS

Every model call appends one AIEDS v2 JSON object to
`traces/model_calls.jsonl`. Set `AIEDS_TRACE_PATH` to change the destination,
`AIEDS_SOURCE` to change the source label, and `AIEDS_CWD_LABEL` to set a
non-sensitive workspace label. The logger never records key values.

Phoenix spans retain hierarchy and nested latency. AIEDS retains token,
energy, carbon, tree-time, estimator version, and confidence fields. Keep both.

Runtime outputs are ignored by Git. `evidence/verified-runs.md` contains
sanitized excerpts from real verification runs.

## Course Map

- `lessons/03-agent-tool-routing.md`
- `lessons/05-span-tracing.md`
- `lessons/06-evaluation-methods.md`
- `lessons/07-router-and-tool-evaluations.md`
- `lessons/08-agent-trajectories.md`
- `lessons/09-convergence-experiments.md`
- `lessons/10-evaluation-driven-development.md`
- `lessons/11-overall-experiment.md`
- `lessons/12-improving-llm-judges.md`
- `lessons/13-production-monitoring.md`

## New Lesson Checklist

1. Add one lesson note under `lessons/` and one runnable `course.py` path.
2. Add only direct, pinned dependencies to `requirements.txt`.
3. Preserve both provider adapters wherever model calls apply.
4. Keep Phoenix failure explicit and AIEDS appending independent.
5. Add deterministic ground truth before adding an LLM judge.
6. Run from a fresh environment and update real-run evidence.
7. Sweep for secrets, private paths, private names, and em dashes.
