# Earth Renderer — Active Architecture

Date: 2026-06-11

Scope: architecture/design only. This is the **current source of truth** for the
Earth renderer and Earth visualization. Historical design provenance (renderer
strategy V1.5 → V2.16, bridge derivations, phase-by-phase evolution) lives in
[`earth-visualization-architecture.md`](earth-visualization-architecture.md),
which is archived and frozen.

This document does not authorize Flutter runtime changes, maps, WebGL, new
providers, Firebase Functions, validation, or deploy. It records the active
architecture only.

## Renderer Status

- **Production renderer: CustomPainter.** The dashboard-first Earth experience
  (Planet Health Schematic, Globe Preview) renders through CustomPainter. This is
  the shipping fallback and remains the default.
- **Preferred future renderer: CesiumJS / Cesium Ion.** The renderer bridge,
  session contracts, security planning, readiness system, data-layer adapter,
  boundary strategy, and an embedding proof are all specified.
- **Contingency: Globe.GL / Three.js.** Not active.
- **Inspiration:** earth.nullschool.net.

### Cesium Bridge Freeze (V2.16)

Cesium bridge **planning is frozen at V2.16**. Do not add V2.17+ planning to the
archived document or here. The bridge architecture is fully specified; the next
Cesium work is **runtime implementation**, not additional planning phases. When
runtime implementation begins, record decisions in this active document.

## Source-of-Truth Flow

The dashboard remains the source of truth. The authoritative flow (per CODEX
Earth Architecture Rules) is:

```text
Earth Dashboard
-> Regional Health Dashboard
-> Narratives
-> Recommendations
-> Correlations
-> Scenario Engine
-> Planet Health Schematic
-> Globe Preview
-> Overlay Governance
-> Provider Matrix
```

Dashboard, layer cards, regional summaries, and layer-detail drilldowns are the
truth. The Planet Health Schematic and Globe Preview visualize that metadata;
they do not replace it. Globe Preview is secondary and experimental.

## Data View Console

The Earth **Data View** tab presents the dashboard metadata as a glanceable,
iCUE-style telemetry console (`_EarthDataDashboard` in
`apps/rand0m/lib/widgets/earth/earth_data_dashboard.dart`): grouped device-style
panels of compact stat tiles (Earth Health gauge, AI Carbon telemetry, Layer
Coverage). It is read-only, additive, and consumes already-derived models plus
the static Earth source registry. Earth View (Globe) and Data View are distinct
workspaces.

## Governance Guardrails (unchanged)

- No unrestricted maps.
- No unrestricted tracking; no live satellite/flight/ship overlays.
- No precise endangered-species exposure.
- No investment framing for carbon-offset data.
- Earth Vision readiness is tooling/research-only — no Flutter web image
  processing, raw imagery downloads, or raw imagery payloads in app runtime
  without an explicitly approved worker/storage phase.

## AIEDS Alignment

Earth Carbon and Tree-Time disclosures align to AIEDS v1 (see
[`aieds-foundation.md`](aieds-foundation.md)) without changing the dashboard
source-of-truth hierarchy. AIEDS keeps Carbon as the primary scientific metric
and Tree-Time as an educational equivalency. AIEDS v1 Mature Reference Tree
(MRT) = 22 kg CO2e/year. Some legacy runtime/history surfaces may still show the
earlier 21 kg/year assumption until a future adoption phase migrates and labels
the methodology; do not mix methodologies without explicit disclosure.

## Provenance

Full historical design record (renderer strategy, bridge <ENV_VAR> design, layer
hierarchy, V1.5 → V2.16 evolution):
[`earth-visualization-architecture.md`](earth-visualization-architecture.md).
