# Lesson 12: Span Tracing With Phoenix

The runnable tracing lesson lives at
`../labs/00/agent-evals/lessons/05-span-tracing.md`. Setup and launch commands
are in `../labs/00/agent-evals/README.md`.

OpenAI calls use `OpenAIInstrumentor`. Anthropic calls use the installed
OpenInference Anthropic instrumentor, which emits comparable LLM spans. Shared
manual spans create this hierarchy for either provider:

```text
AgentRun [AGENT]
  router_turn [CHAIN]
    provider model call [LLM]
    execute_tool_calls [CHAIN]
      tool [TOOL]
        model call or application sub-step
```

The collector defaults to `http://127.0.0.1:6006/v1/traces` and project
`agent-evals-course`. Both are configurable by environment. If Phoenix is not
running, the lab states that export is disabled, completes the agent run, and
continues appending AIEDS JSONL.

Spans provide hierarchy and nested latency. AIEDS provides token, energy,
carbon, tree-time, estimator version, and confidence fields. They are
complementary records.
