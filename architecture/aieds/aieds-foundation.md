# AI Environmental Disclosure Standard Foundation

Date: 2026-06-05

Scope: architecture and app-foundation guidance only. This document does not
authorize provider integrations, live Earth linkage, Slack/Jira/GitHub
integration, Firebase Functions, OAuth, deployment, or unrelated runtime
changes.

## Purpose

AI Environmental Disclosure Standard (AIEDS) v1 is the Random Knights
ecosystem standard for reporting AI environmental impact in a consistent,
educational, transparent, and provider-agnostic way.

AIEDS is intended to align agent responses, reports, Earth Intelligence,
automation summaries, test results, podcasts, and daily summaries around one
methodology. It does not imply exact emissions, provider certification, offset
quality, restoration outcomes, or verified environmental impact unless a future
phase adds approved evidence and confidence rules.

## Foundation Model

AIEDS v1 defines these foundation types:

- `AIEDSMetric`: one reportable measurement or equivalency.
- `AIEDSDisclosure`: one rendered disclosure attached to a response, report,
  test result, or automation summary.
- `AIEDSMethodology`: assumptions, formulae, limitations, and future context.
- `AIEDSConfidence`: confidence label for the disclosure.
- `AIEDSVersion`: version metadata, starting with `AIEDS v1`.

## Metric Hierarchy

Level 1 - Scientific:

- Energy, measured in Wh, required.
- Carbon, measured in g CO2e, required.

Carbon remains the primary environmental metric.

Level 2 - Operational:

- Model, required.
- Provider, required.
- Cost, required.
- Latency, required.

Level 3 - Human Equivalencies:

- Tree-Time, optional.
- Phone Charge Equivalent, optional.
- LED Bulb Equivalent, optional.
- Driving Distance Equivalent, optional.

Tree-Time is an educational equivalency. It is not a primary scientific metric,
offset claim, restoration claim, or conservation claim.

Level 4 - Earth Context:

- Regional Grid Context, future.
- Carbon Intensity Context, future.
- Restoration Context, future.
- Earth Intelligence Context, future.

No live Earth linkage is enabled in A1.0.

## Mature Reference Tree Methodology

AIEDS v1 defines Mature Reference Tree (MRT):

- `1 MRT = 22 kg CO2e/year`

Tree-Time formula:

```text
tree_time_minutes = (carbon_g_co2e / 22000) * 525600
```

Assumptions:

- Carbon remains the primary metric.
- Tree-Time is derived from reported carbon and MRT.
- MRT is a stable educational reference, not a claim about a specific tree,
  forest, restoration project, or offset.
- Existing runtime surfaces may still show legacy Tree-Time assumptions until
  a future adoption phase migrates and labels them.

Limitations:

- Provider energy data is not available by default.
- Regional grid mix varies and is future Earth context.
- Human equivalencies are illustrative.
- AIEDS v1 does not add verification, certification, or provider-derived
  measurement.

## Confidence Model

AIEDS v1 confidence states:

- Estimated.
- Modeled.
- Provider-derived.
- Verified.

Current Random Knights ecosystem disclosures should use `Estimated` or
`Modeled` unless an approved future phase adds provider-derived or verified
evidence. Disclosures must avoid unsupported precision, certification, or
environmental outcome language.

## Earth Alignment

Future Earth integration should follow this chain:

```text
AI Response
-> Carbon
-> Tree-Time
-> Earth Context
-> Regional Context
-> Restoration Context
```

Earth may eventually contextualize carbon disclosures with regional grid,
carbon intensity, restoration, and Earth Intelligence metadata. A1.0 only
defines readiness; it does not connect live Earth data to AI response
disclosures.

## Future Consumers

Agents:

- rand0m
- science reviewer
- engineering reviewer
- aut0mate
- rep0rter
- other future agents

Features:

- Earth
- Test
- GitHub reporting
- Slack reporting
- Jira reporting
- Podcasts
- Daily summaries

## Sample Disclosure

```text
Model: Claude
Provider: Anthropic
Latency: 4.2s
Cost: $0.0012
Energy: 0.42 Wh
Carbon: 0.18 g CO2e
Tree-Time: 3.2 minutes
Confidence: Estimated
Methodology: AIEDS v1
```

The sample is concise and illustrative. Formula-derived Tree-Time disclosures
should use the MRT formula above unless a disclosure explicitly explains a
different educational example value.

## A1.1 Response Metrics Integration

A1.1 integrates AIEDS v1 into response and reporting surfaces without adding
provider-specific live measurement.

Compact default display:

- Carbon.
- Energy.
- Tree-Time.
- Confidence.

Expanded/details display:

- Provider.
- Model.
- Latency.
- <ENV_VAR>.
- Cost.
- Driving distance comparison.
- Phone charge comparison.
- LED bulb time comparison.
- Laptop time comparison.
- Methodology and assumptions.

Required copy:

- `AIEDS v1 estimated disclosure`
- `Energy and carbon are modeled estimates.`
- `Tree-Time and equivalents are educational comparisons.`

Reporting surfaces may show AIEDS readiness when runner metrics are not yet
available. They must not fabricate execution impact, offsetting, restoration,
or verified environmental claims.

## Current Boundary

AIEDS v1 foundation work does not add:

- Provider integrations.
- Earth runtime changes.
- Live regional carbon context.
- Slack, Jira, or GitHub integrations.
- Firebase Functions.
- OAuth.
- Deployment.
