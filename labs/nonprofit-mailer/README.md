# Nonprofit Mailer - an AI Quality Blueprint demo

An LLM drafts outreach email for one real organization, and then this lab spends
considerably more effort trying to prove the draft is untrustworthy than it spent
writing it. That asymmetry is the entire point.

**Drafts are never sent.** This tool has no ability to send email.

## Read this before anything else

- **Illustrative demo.** Nothing here describes a real outreach programme.
- **Statuses are SYNTHETIC.** Every lifecycle status is randomly assigned and
  labelled as such wherever it appears. They are **not real affiliations**.
  Random Knights has no relationship with any organization in this dataset.
- **The sender is real.** Random Knights is the fixed sender, and every claim a
  draft makes about it must trace to a sourced fact in `src/sender.js`.
- **The recipients are real, from public data.** Organization name, NTEE
  category, city/state and revenue come from the public IRS Exempt Organizations
  Business Master File and the US Census (both public domain). **Org-level only:
  no individuals, no contacts, no PII.**

## Quick start

```
cd nonprofit-mailer
npm install
$env:ANTHROPIC_API_KEY="sk-ant-..."
node src/server.js
```

Open http://localhost:4000, pick an org, read its synthetic status, choose a
campaign, run the pipeline.

## The structure: org x status x campaign

The unit of work is a triple. Each axis comes from somewhere different, and the
difference is the interesting part.

| Axis | What it is | Where it comes from |
| --- | --- | --- |
| **Sender** | Random Knights. Fixed. | `src/sender.js` - sourced facts only |
| **Recipient** | A real environmental nonprofit | `data/nonprofits-env.json` - public IRS/Census |
| **Status** | A synthetic lifecycle stage | `src/status.js` - a hash, not a record |
| **Campaign** | The send type | `src/campaigns.js` - lit up by status |

Status lights up the applicable campaigns: you cannot run a Win-back at a
Prospect, or Onboarding at an org that has never adopted anything. The ladder is
Prospect, Adopter, Subscriber, Supporter, Patron, Benefactor, Lapsed.

Notice that **status is the only axis a real CRM would own**. Org data is public
record; the campaign is a choice; only the status requires knowing something
private. That is why the status lookup is the adapter seam - see below.

## The blueprint

### 1. Grounding - no hallucinatory drift

Every claim must trace to the sender's fact base, the recipient's public profile,
or common knowledge that asserts nothing about either party. Anything else fails.

**Trust is the metric.** A fabricated email is worse than no email: it converts a
stranger into someone who now knows the sender invents things. That is not a
quality regression, it is a permanent loss, so the gate is a veto rather than a
score.

Two independent layers, **either can fail a draft**:

- **Layer 1 - deterministic red lines** (`redLineCheck`). Regexes for the claims
  that must never ship: "your donation", "thanks for your support", "since you
  joined", "we certified". Cheap, and immune to model judgment.
- **Layer 2 - model judge** (Opus 4.8, adaptive thinking, schema-enforced).
  Traces every remaining claim: invented programs, invented outcomes,
  plausible-sounding numbers, implied history.

Layer 1 exists **because** Layer 2 is itself an LLM. Using a model to check a
model is useful but not sufficient, so the hardest rules are also enforced by
code that cannot be persuaded.

The gate's most important rule: because statuses are synthetic, **any** claim of
a real relationship is a fabrication regardless of which status is active.

### 2. Variance - a single run tells you nothing

One green run is not evidence. The same triple, at a **fixed temperature**,
produces a distribution of quality, and the shape of that distribution is the
signal. A prompt that scores 92 once and 41 once is not a 92 prompt and not a 67
prompt. It is an unreliable prompt, and shipping it means somebody gets the 41.

So the pipeline generates N times (default 5) with every knob held constant, and
reports **min / max / spread / median / std dev** plus a histogram - never a
single number. Spread over 15 points is flagged `unstable`; over 25, `regression`.
Intermittent gate failures are surfaced as the headline even when most runs pass.

**The floor matters more than the mean.** The mean is what you hope for; the min
is what you actually ship to somebody.

This is why the drafter is Sonnet 4.6: it still accepts a `temperature`
parameter, so "N runs at a fixed temperature" is literally expressible. Opus 4.8
removed sampling parameters entirely (they return a 400).

### 3. Safety

- Drafts only. No send path exists in the code.
- Prominent, permanent disclaimer in the UI.
- Statuses labelled synthetic at every appearance.
- Org-level public data only. No individuals, no contact data, no PII.
- The negative-control fabrication mode is reachable only from an explicit
  "prove the gate" button, and its output is a draft like any other.

## Proving the gate catches things

Evidence beats assertion, so the demo ships its own negative control. The
**"Prove the gate"** button instructs the drafter to deliberately invent a
relationship, a program, statistics, and a certification - then runs the result
through the gate. A polished, plausible, entirely false email goes in; the gate
should catch it and force the score to 0.

If that button ever reports `GATE MISSED IT`, the gate has a bug.

## Plugging in a real member dataset

`src/datalake.js` is the seam. Everything downstream consumes:

```
MemberSource.statusFor(orgId) -> { id, label, synthetic, ... }
```

The demo implements it as a hash. The **real** implementation lives in the
private `xyz-outreach` tool and is deliberately absent here: this repo is public,
and a real member list is real data about real organizations. The seam is public;
the data is not. `MEMBER_SOURCE=real` throws rather than silently falling back.

If you implement it, the safety properties this demo gets for free become your
job - `src/datalake.js` spells out all three. The one worth repeating: the gate
forbids "your donation" because here nothing was ever donated. With a real
source that claim may become **true**, and the gate must then be given the
supporting facts to check it against, not simply relaxed. Loosening the gate
without supplying the facts is how you ship a confident lie.

## Architecture

```
data/nonprofits-env.json  4,000 real orgs, public IRS/Census, org-level only
src/sender.js             Random Knights: sourced facts + must-not-claim list
src/orgs.js               recipient search/typeahead (name / NTEE / size / state)
src/status.js             the synthetic status ladder + its labelling
src/campaigns.js          campaign tags + the status -> campaign routing
src/grounding.js          THE GATE: red lines (code) + judge (Opus 4.8)
src/variance.js           N runs, distribution, spread verdict
src/ai.js                 drafter (Sonnet 4.6 @ fixed temp) + eval judge (Opus 4.8)
src/datalake.js           the real-member-dataset seam
src/server.js             web UI + API
```

### Models, and why they differ

| Step | Model | Why |
| --- | --- | --- |
| Draft | `claude-sonnet-4-6` @ temperature 1.0 (fixed) | The only tier where "fixed temperature" is expressible - Opus 4.8 removed sampling params |
| Grounding gate | `claude-opus-4-8`, adaptive thinking, `effort: high` | Trust-critical: the strongest model checks the claims |
| Eval | `claude-opus-4-8`, schema-enforced output | Structured outputs are unsupported on Sonnet 4.6 |

## Data provenance

Recipients come from the same public pipeline dataset that feeds the rand0m.ai
Earth globe:

```
https://storage.googleapis.com/randomknights-xyz.firebasestorage.app/nonprofits/nonprofits-env-points.json
```

Vendored here trimmed to org-level fields so the lab runs offline. The upstream
set carries ZIP-centroid `lat`/`lon`; those were **dropped** when vendoring,
because a mailer has no business knowing a location finer than city/state.

Source: IRS Exempt Organizations Business Master File + US Census ZCTA Gazetteer.
Licence: US Government public domain. NTEE groups C (Environment) and D
(Animal-Related).

## A note on AIEDS

RK's own repos disagree on what AIEDS expands to. The live spec repo (v2.0.0)
says **AI Energy Disclosure Standard**; older public docs say "Environmental",
but they are all v1-era and the spec repo marks v1.x superseded. This lab uses
**Energy**, and records the conflict in `src/sender.js` (`NAME_CONFLICT`) so
nobody silently "fixes" it back.

Fitting, for a demo about grounding: the first thing that had to be checked was
the sender's own claims about itself.
