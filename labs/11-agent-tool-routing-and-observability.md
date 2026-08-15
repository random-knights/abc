# Lab 11: Agent Tool Routing And Observability

Runnable evaluation lab for the L3 agent course material. Read
`../lessons/11-agent-tool-routing-and-observability.md` for the evidence and
adoption judgment.

The runnable files are isolated under
`../assets/python/l3-agent-tool-routing/`. They must never be imported by app
code.

The course parquet file was not provided, so `scripts/make_fixture.py` generates
a labeled synthetic lab fixture at `data/store_sales_fixture.parquet`. This is
the single labeled exception to the workspace no-demo-data rule. The no-demo-data
rule still applies everywhere else in the ecosystem.

## Run

```powershell
cd C:\rand0m\abc\assets\python\l3-agent-tool-routing
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe scripts\make_fixture.py
.\.venv\Scripts\python.exe run_lab.py
```

`OPENAI_API_KEY` and `ANTHROPIC_API_KEY` must come from the environment. Never
write keys to this folder.

Outputs:
- `outputs/phase1_openai_transcript.txt`
- `outputs/phase2_provider_comparison.txt`
- `traces/model_calls.jsonl`
- `../../../lessons/11-agent-tool-routing-and-observability.md`
