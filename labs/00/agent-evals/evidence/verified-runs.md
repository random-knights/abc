# Verified Runs

## 2026-08-18: Short Dual-Provider Course

The documented short course completed with this command:

```powershell
.\.venv\Scripts\python.exe course.py all --provider both
```

The run used the course model pins: `gpt-4o-mini` for the OpenAI agent,
`gpt-4o` for the OpenAI judge, and `claude-sonnet-5` for the Anthropic agent
and judge.

Verified results:

- lessons 03, 05, 06, 07, 08, 09, 10, 11, 12, and 13 completed;
- both providers completed without an authentication, transport, or model error;
- Phoenix recorded 10 experiments and 46 evaluation results;
- AIEDS v2 recorded 131 successful model calls and 83,107 tokens;
- the recorded estimate was 25.8065 Wh, 11.0710 g CO2e, and 277.09 minutes
  of tree time;
- the chart data fidelity evaluator detected the known placeholder-data defect
  four times;
- the final monitoring gate reported `blocked_by_known_chart_defect`;
- the Phoenix trace flush completed.

Lesson 07 also produced a useful judge disagreement. The Anthropic clarity
judge labeled one answer unclear because it treated the user's question as if
no lookup evidence existed, while the entity judge correctly matched the same
answer to the tool evidence. The course keeps disagreements visible instead of
turning every score into a pass.

The model-generated chart code was parsed and compiled, not executed. The
fixture is synthetic and labeled. Runtime transcripts, traces, experiment
records, and monitoring output remain ignored by Git.
