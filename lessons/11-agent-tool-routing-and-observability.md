# Lesson 11: Agent Tool Routing And Observability

This lesson records what the L3 agent lab proved and what this ecosystem should
adopt. The runnable companion lives at
`../assets/python/l3-agent-tool-routing/`, and the lab instructions live at
`../labs/11-agent-tool-routing-and-observability.md`.

The original lane built the lab as a standalone artifact, generated a
reproducible synthetic parquet fixture, ran the router, and wrote append-only
model-call traces.

## Evidence From This Run

Phase 1 used the course model pin, `gpt-4o-mini`. It did not reach tool routing
because the environment OpenAI key was rejected:

```text
provider: openai
model: gpt-4o-mini
query: Show me the code for a bar chart of total sales by store in November 2021 and tell me what trends you see.

router turn 1: calling model

ERROR: AuthenticationError: Error code: 401 - {'error': {'message': 'Incorrect API key provided: [REDACTED_API_KEY] You can find your API key at https://platform.openai.com/account/api-keys.', 'type': 'invalid_request_error', 'code': 'invalid_api_key', 'param': None}, 'status': 401}
```

Phase 2 ran the same query through both adapters. OpenAI again stopped at auth.
Anthropic completed the router loop:

```text
openai: []
anthropic: ['lookup_sales_data', 'generate_visualization', 'analyze_sales_data']
```

Anthropic turn 1 chose lookup:

```text
router turn 1: tool calls [{"name": "lookup_sales_data", "arguments": {"prompt": "Total sales by store in November 2021"}}]
tool result lookup_sales_data: store_id total_sales 1320 4903.81 1401 4857.91 1776 4703.10 2021 4617.73
```

Anthropic turn 2 chose visualization and analysis in the same router turn:

```text
router turn 2: tool calls [{"name": "generate_visualization", "arguments": {"data": "store_id  total_sales\n     1320      4903.81\n     1401      4857.91\n     1776      4703.10\n     2021      4617.73", "visualization_goal": "Bar chart of total sales by store in November 2021"}}, {"name": "analyze_sales_data", "arguments": {"data": "store_id  total_sales\n     1320      4903.81\n     1401      4857.91\n     1776      4703.10\n     2021      4617.73", "prompt": "What trends do you see in total sales by store in November 2021?"}}]
```

The most important failure was inside the visualization tool. It generated code
with random sample data even though the tool received real data:

```text
tool result generate_visualization: import matplotlib.pyplot as plt import random # Generate sample data random.seed(42) store_id = [f"Store {i}" for i in range(1, 11)] total_sales = [random.randint(1000, 10000) for _ in range(10)]
```

The final Anthropic answer caught and corrected that tool failure in prose:

```text
Here's the situation: the visualization tool generated placeholder/random sample code instead of using your actual dataset, so I've corrected it below to plot your real November 2021 numbers.
```

The trace file is
`../assets/python/l3-agent-tool-routing/traces/model_calls.jsonl`. It recorded two OpenAI auth-error
calls and seven Anthropic calls. Example records:

```json
{"tsUtc": "2026-08-13T16:31:14.899072Z", "provider": "openai", "model": "gpt-4o-mini", "tokensIn": 0, "tokensOut": 0, "tokensTotal": 0, "carbonG": 0.0, "energyWh": 0.0, "treeTimeMin": 0.0, "aiedsModelVersion": "v2", "aiedsConfidence": "vendorPublished", "source": "rk_evals-l3-lab", "sessionId": "3ae77db8-7cf6-4d20-8745-0382b15fa2c7", "cwd": "C:\\rand0m\\rk_evals", "latencyMs": 1017, "toolCallsChosen": [], "outcome": "error", "runId": "phase1-openai-8d1b83dc-f446-442b-bb63-38175f47be5f", "callIndex": 1, "errorType": "AuthenticationError"}
{"tsUtc": "2026-08-13T16:31:24.792272Z", "provider": "anthropic", "model": "claude-sonnet-5", "tokensIn": 1008, "tokensOut": 266, "tokensTotal": 1274, "carbonG": 0.15466651199999998, "energyWh": 0.36052799999999996, "treeTimeMin": 3.8710818432, "aiedsModelVersion": "v2", "aiedsConfidence": "classEstimated", "source": "rk_evals-l3-lab", "sessionId": "3ae77db8-7cf6-4d20-8745-0382b15fa2c7", "cwd": "C:\\rand0m\\rk_evals", "latencyMs": 3326, "toolCallsChosen": ["generate_visualization", "analyze_sales_data"], "outcome": "success", "runId": "phase2-anthropic-1f731e36-3fa7-4003-8128-899e20c46604", "callIndex": 3}
```

## What The Lab Does That This Ecosystem Does Not

The lab makes the router's tool choices visible. This ecosystem has
`executeAgentTool` audit records for hosted tool calls, but it does not yet
record every router decision as a per-model-call trace with `toolCallsChosen`,
latency, provider, model, token counts, and AIEDS v2 fields. That belongs beside
the existing AIEDS write path, not inside the tool host alone, because router
calls can choose no tool, one tool, or multiple tools before the host is reached.

The lab gives tools typed parameter schemas that the router can inspect. Our
current `executeAgentTool` path has a strong server-side registry, tiers, grants,
audit records, truncation, and untrusted-data envelopes. It does not yet expose
rich per-tool parameter schemas through the bridge. The current MCP bridge maps
caller input to a single `query` argument. That is the single-query-argument gap:
it cannot express that `generate_visualization` needs both `data` and
`visualization_goal`, or that `analyze_sales_data` needs `data` and `prompt`.

Where pieces should go:

- `rk_agents`: extend `McpToolDescriptor` or its successor with a provider-neutral
  input schema and parameter descriptions.
- `xyz/lib/services/agents/tool_invoker.dart`: register hosted tools with their
  schemas, not only labels and descriptions.
- `xyz/functions/src/agentToolHost.ts`: validate arguments against the server
  registry schema before dispatch. The client schema is routing help, not the
  security boundary.
- `xyz/lib/services/agents/primary_action_runner.dart` or the router layer that
  surrounds it: emit per-model-call traces, including no-tool decisions.
- AIEDS store: keep the existing v2 fields (`tsUtc`, `provider`, `model`,
  `tokensIn`, `tokensOut`, `tokensTotal`, `carbonG`, `energyWh`, `treeTimeMin`,
  `aiedsModelVersion`, `aiedsConfidence`) and add router-specific fields such as
  `toolCallsChosen`, `latencyMs`, `outcome`, `runId`, and `callIndex`.

The lab also proves that typed output is useful but incomplete. The chart config
was typed, but the next LLM call still produced random sample code. Typed output
must be paired with artifact verification. For this ecosystem, that means a
generated chart or file must be checked against the data it claims to represent.

## Structured Judge Records

Today JUDGE is a prose pass. It is readable, but the accuracy signal disappears
back into text after every run. To track accuracy over time, JUDGE needs to emit
one JSONL record per claim, with the prose report still available for humans.

Sketch:

```json
{
  "tsUtc": "2026-08-13T16:31:00Z",
  "judgeRunId": "judge-20260813-001",
  "claimId": "xyz-pr-357-ci-gate",
  "subjectType": "pull_request",
  "repo": "xyz",
  "pr": 357,
  "claim": "CI Gate passed on the final PR SHA.",
  "verdict": "confirmed",
  "confidence": "ground_truth",
  "evidenceKind": "gh_check",
  "evidence": {
    "command": "gh pr checks 357 --repo random-knights/xyz",
    "sha": "example-sha",
    "requiredCheck": "CI Gate",
    "status": "SUCCESS"
  },
  "discrepancy": null,
  "ownerAction": null,
  "validatorVersion": "judge-jsonl-v1"
}
```

Useful verdict values: `confirmed`, `false`, `partial`, `unverifiable`.

Useful aggregate metrics:
- claim accuracy by lane and agent
- false-claim rate by claim type
- unverifiable rate, which is usually a tooling gap
- time from builder report to judge confirmation
- repeat discrepancy classes, such as stale merge status or missing deploy proof

This should not replace the current JUDGE prose. It should make the prose
queryable.

## What Not To Adopt

Do not adopt LLM-generated SQL as a production pattern. It is fine for a lab
fixture, but in the app it would need a constrained query builder, an allowlist
of tables and columns, read-only credentials, row limits, and a verifier. The
lab's SQL generator is useful as an evaluation target, not as an app design.

Do not adopt chart-code generation as a trusted artifact. The run showed why:
the visualization tool received real data and still generated random sample
data. The final model corrected it, but relying on a later prose pass to repair
a bad artifact is not verification.

Do not adopt hidden model calls inside tools without tracing. In this lab,
`lookup_sales_data`, `analyze_sales_data`, and `generate_visualization` can each
make their own model calls. Without the trace JSONL, the visible router transcript
understates cost and latency.

Do not adopt the synthetic fixture outside this folder. It exists because the
course parquet was missing. The lab README labels this directory as the single
exception. The app's no-demo-data rule remains intact.

Do not build the provider seam by copying OpenAI and Anthropic message formats
through the codebase. Keep one internal interface and let adapters translate at
the edge. The tools should not know which provider routed them.

## Recommendation

Adopt three things:

1. Provider-neutral tool schemas with parameter descriptions.
2. Per-model-call trace JSONL using AIEDS v2 fields plus router fields.
3. Structured JUDGE verdict JSONL beside the existing prose report.

Do not implement those in this lane. The next lane should start with schema-rich
tool descriptors, because that is the root cause of both routing quality and
observable tool selection.
