# Lesson 11: Agent Tool Routing And Observability

The runnable companion has moved into the self-contained course at
`../labs/00/agent-evals/`. Start with its
[`README.md`](../labs/00/agent-evals/README.md), then work through internal
lessons 03 and 05.

The lab provides:

- one provider-neutral router with OpenAI and Anthropic adapters;
- typed lookup, analysis, and visualization tools;
- one append-only AIEDS v2 record per model call;
- one Phoenix agent span tree per query;
- a labeled synthetic parquet fixture that can be regenerated locally.

The central observed failure is a chart generator that receives real data but
can emit placeholder values. Internal lesson 05 shows where to find that
boundary in a span tree. Later course lessons evaluate and monitor it.

The original asset location now contains a pointer only. There is one copy of
the implementation.
