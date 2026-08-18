# Lesson 05: Span Tracing

## Source Basis

Implemented from the lesson 5 notebook and transcript. OpenAI calls use
`OpenAIInstrumentor`; Anthropic calls use `AnthropicInstrumentor`. The installed
Anthropic instrumentor is used because it emits OpenInference LLM spans that
are comparable with the OpenAI spans. Manual Anthropic LLM spans are not needed.

## Run

Start Phoenix, then run:

```powershell
.\.venv\Scripts\python.exe course.py 05 --provider both
.\.venv\Scripts\python.exe scripts\dump_phoenix_spans.py
```

Each query creates this hierarchy:

```text
AgentRun [AGENT]
  router_turn [CHAIN]
    provider model call [LLM]
    execute_tool_calls [CHAIN]
      tool [TOOL]
        nested model call [LLM]
        application sub-step [CHAIN]
```

## Read The Defect

Open `generate_visualization > create_chart`. Its input includes real rows and
its output can contain invented values. That is the first boundary where real
data becomes placeholder data.

## AIEDS

Spans add hierarchy, parent-child relationships, nested latency, and rich
inputs and outputs. AIEDS retains environmental accounting and a durable
append-only record. Neither replaces the other.

| AIEDS | Span view |
| --- | --- |
| `provider`, `model` | `llm.provider`, `llm.model_name` |
| `tokensIn`, `tokensOut` | prompt and completion token attributes |
| `latencyMs` | span start and end time |
| `toolCallsChosen` | LLM output plus child tool spans |
| `runId`, `callIndex` | trace, span, and parent identifiers |
| energy, carbon, tree-time | no equivalent in this course span schema |
