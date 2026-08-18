# Lesson 08: Agent Trajectories

## Source Basis

Transcript-derived. No notebook was provided for lesson 8.

## Run

```powershell
.\.venv\Scripts\python.exe course.py 08 --provider both
```

A trajectory is the route from user input through router turns and tools to the
final response. This implementation counts the user step, router calls, and
tool calls. Fewer correct steps usually mean lower latency, cost, and variance.

Convergence is the shortest observed path divided by each observed path length.
It measures efficiency, not correctness. Pair it with output evaluators.

## AIEDS

AIEDS adds model-call count, latency, energy, carbon, and tree-time to the path
length. A shorter trajectory that uses a larger model can still consume more.
