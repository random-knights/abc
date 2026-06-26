# AI Environmental Disclosure Standard (AIEDS) — Open Standard Draft

Status: Draft v0.1 (open-standard framing). Date: 2026-06-11

Scope: this document drafts AIEDS as a **publishable open standard**. It builds
on the internal foundation in [`aieds-foundation.md`](aieds-foundation.md) and the
shipped Random Knights implementation (Random1y response disclosures), and
reframes them for external adoption. It does not change runtime behavior; it
defines the contract others (and we) implement.

The hosted Random Knights instance remains private; the *standard* is intended
to be open and implementable by anyone.

## 1. Purpose

AIEDS is a provider-agnostic standard for disclosing the environmental impact of
an AI interaction in a consistent, educational, and honest way. It lets any
product attach a comparable "nutrition label" to an AI response, report, agent
output, test result, or automation summary.

Design principles:

- **Honest over precise.** Every value is a clearly-labeled estimate unless an
  approved evidence tier upgrades its confidence.
- **Carbon-primary.** Carbon (g CO2e) is the primary scientific metric; energy
  (Wh) is the co-primary input. Everything else is operational or educational.
- **Provider-agnostic.** No vendor lock-in; works with estimated or
  provider-derived data.
- **Comparable.** A fixed methodology (and version) makes disclosures
  comparable across providers and time.
- **No greenwashing.** Equivalencies are educational only and must not be
  presented as offsets, certification, or restoration.

## 2. Metric Hierarchy

Level 1 — Scientific (required):

- `energy_wh` — energy, in watt-hours.
- `carbon_g_co2e` — carbon, in grams CO2e. Primary metric.

Level 2 — Operational (required where available):

- `model`, `provider`, `cost`, `latency`.
- `<ENV_VAR>`, `<ENV_VAR>`.

Level 3 — Human Equivalencies (optional, educational only):

- `tree_time` (see §3), phone-charge, LED-bulb-time, laptop-time,
  driving-distance.

Level 4 — Earth Context (future, optional):

- Regional grid intensity, renewable mix, restoration context. Not part of v1
  required output.

## 3. Methodology

### 3.1 Energy ↔ Carbon

Implementations SHOULD use provider-reported energy where available
(`confidence: Provider-derived`). When unavailable, energy MAY be modeled from
carbon (or vice versa) using a declared grid carbon intensity:

```text
energy_wh = (carbon_g_co2e / grid_intensity_g_per_kwh) * 1000
```

The Random Knights reference implementation models energy from its <ENV_VAR>-based
carbon estimate using a global-average grid intensity of `429 g CO2e/kWh`
(modeled; not regional). Implementations MUST declare the intensity and source
they use.

### 3.2 Mature Reference Tree (Tree-Time)

AIEDS defines a Mature Reference Tree (MRT) for the educational Tree-Time
equivalency:

```text
1 MRT = 22 kg CO2e / year
tree_time_minutes = (carbon_g_co2e / 22000) * 525600
```

MRT is a stable educational reference, not a claim about any specific tree,
forest, offset, or restoration project.

### 3.3 Other equivalencies (educational references)

Reference constants used by the Random Knights implementation (implementations
MAY substitute documented values):

- Phone charge ≈ `12 Wh` per full charge.
- LED bulb ≈ `10 W`.
- Laptop ≈ `50 W`.
- Driving ≈ `170 g CO2e/km` (typical ICE passenger car).

## 4. Confidence Model

`confidence` is one of: `Estimated`, `Modeled`, `Provider-derived`, `Verified`.

- `Estimated` / `Modeled` — derived from heuristics or models (default tier).
- `Provider-derived` — sourced from provider-reported measurement.
- `Verified` — independently audited evidence.

Disclosures MUST NOT claim a tier they cannot support, and MUST avoid
certification or environmental-outcome language above their tier.

## 5. Disclosure Schema (v1)

A conforming disclosure is an object with at least:

```json
{
  "version": "AIEDS v1",
  "confidence": "Estimated",
  "energy_wh": 0.42,
  "carbon_g_co2e": 0.18,
  "provider": "anthropic",
  "model": "claude-...",
  "latency_ms": 4200,
  "<ENV_VAR>": 120,
  "<ENV_VAR>": 80,
  "cost_usd": 0.0012,
  "methodology": "AIEDS v1; MRT=22kg CO2e/yr; grid=429 g/kWh (modeled)",
  "equivalencies": {
    "tree_time_minutes": 4.30,
    "phone_charges": 0.0349,
    "led_bulb_hours": 0.0419,
    "laptop_minutes": 0.503,
    "driving_meters": 1.06
  }
}
```

Required display copy (any surface rendering a disclosure):

- `AIEDS v1 estimated disclosure`
- `Energy and carbon are modeled estimates.`
- `Tree-Time and equivalents are educational comparisons.`

Compact surfaces MAY show only Carbon, Energy, Tree-Time, and Confidence, with
the rest behind an expand affordance (the Random Knights reference pattern).

## 6. Versioning & Governance

- The standard is versioned (`AIEDS v1`, then `v2`, …). Methodology changes that
  alter values require a version bump.
- Mixed methodologies MUST NOT be combined without explicit disclosure (e.g. a
  legacy `21 kg/yr` Tree-Time surface must be labeled until migrated).
- Governance/contribution process and license are TBD before public release;
  intent is a permissive open license for the specification text.

## 7. Reference Implementation

Random Knights implements AIEDS v1 on Random1y response cards:

- Pure model: `apps/rand0m/lib/models/aieds/aieds_disclosure.dart`
- Presentation: `apps/rand0m/lib/widgets/chat/aieds_disclosure_card.dart`
- Tests: `apps/rand0m/test/aieds_disclosure_test.dart`

## 8. Out of Scope (this draft)

- Live regional grid/carbon-intensity feeds (Level 4).
- Provider-derived/Verified evidence pipelines.
- Certification, offset markets, or restoration accounting.

## 9. Open Questions

- Canonical JSON schema + content-type for machine-readable disclosures.
- Per-provider default energy/carbon coefficients and their sourcing.
- How AIEDS attaches to non-chat surfaces (reports, agent runs, test results,
  Earth Intelligence) in a uniform envelope.
- Licensing and a lightweight conformance test suite.
