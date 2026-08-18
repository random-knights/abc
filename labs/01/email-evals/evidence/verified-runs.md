# Verified Runs

Verified on 2026-08-18 with local Phoenix serving on port 6006.

```powershell
.\.venv\Scripts\python.exe scripts\make_fixture.py
.\.venv\Scripts\python.exe course.py all --provider both
.\.venv\Scripts\python.exe scripts\dump_phoenix_spans.py
```

## Result

- Lessons 03, 05, 06, 07, 08, 09, 10, 11, 12, and 13 completed.
- OpenAI and Anthropic both produced labeled, checked draft transcripts.
- Phoenix recorded 10 experiments and 44 evaluations.
- The deterministic release gate found 0 failures and reported `ready`.
- AIEDS recorded 130 successful model calls and no error outcomes.
- The run used 202,839 tokens: 163,921 input and 38,918 output.
- Modeled impact was 55.348166 Wh, 23.744363 g CO2e, and 594.287491
  tree-time minutes under AIEDS v2.
- Models were `gpt-4o-mini` for 45 calls, `gpt-4o` for 12 judge calls, and
  `claude-sonnet-5` for 73 calls.
- Phoenix readback showed successful OpenAI and Anthropic `AgentRun` trees with
  router, LLM, tool, nested draft, and deterministic-check spans.
- Runtime artifacts were ASCII, contained no em dashes, and contained no 401 or
  API-key error transcript.

## Judge Findings

Four of 44 evaluation scores were below one. These were not deterministic
release failures:

- One baseline Anthropic grounding judge rejected an explicit statement that
  no prior affiliation or contact existed. The candidate prompt passed; the
  case stays visible as a judge-policy disagreement.
- Three baseline safety-judge cases missed deterministic unsafe labels. The
  rubric-driven judge versions are recorded separately for comparison.

The run also promoted three judge-found issues into hard checks before this
evidence was written: missing synthetic labels, invented discovery language,
and unsupported joint-review claims.

## Data Boundary

The work mailer was usable as an architecture reference but not as a public data
source because its sender context is private. This course uses a generated
`synthetic_labeled` fixture. No organization, person, relationship, contact,
address, status, or campaign in that fixture is real.
