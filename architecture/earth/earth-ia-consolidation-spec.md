# Earth IA Consolidation — Spec (D1–D8)

Date: 2026-06-12 (IA v2 appended session 25)
Author: Design agent (spec); Docs agent (persisted per §15)
Ratified by: governance reviewer (session 19); IA v2 owner directive (session 25)
Amendment: Design agent implements all D-slices in `worktrees\<PROJECT_ID>`;
  Earth agent is integrator and merge gate for all D-slices.
Status: D1–D5 deployed `c150405` (R7); D6 SUPERSEDED by IA v2; D7 in flight (C8); D8 queued (C9)

---

## Mandate

Owner directive (session 19): remove, reorganize, and clean most non-globe
containers in the Earth Data View. The current surface has too many containers,
overlapping responsibilities, and inconsistent density. The consolidation target
is a 3-workspace Data View that is globe-first, legible, and extensible without
further accumulation.

**Scope boundary:** presentation and layout only. No data models, no catalog
files, no Earth layer definitions, no registry changes. Design agent owns the
workstation-shell and tab presentation surface. Earth agent integrates and gates
every D-slice merge.

---

## Current Surface — KEEP / MERGE / REMOVE / REDESIGN

| Container / Surface | Verdict | Notes |
| --- | --- | --- |
| Globe (Cesium renderer) | **KEEP** — globe-inheritance constraint; no changes to Cesium runtime | D-slices work around the globe, not over it |
| Earth+ workstation shell | **REDESIGN** — D1 | Pill position, tab rail, overflow; D1 blocked on pill corner ruling |
| Layer grid (primary data cards) | **KEEP + REORGANIZE** — D3 | Taxonomy tiers applied; density rules enforced |
| Health score / trend summary | **KEEP** — moves to consolidated header | Compact representation; no widget duplication |
| Renderer readiness panel | **MERGE** into workstation shell — D2 | Folded; not a standalone surface |
| Usage / session panels | **REMOVE** — D5 | Replaced by Intelligence summary (separate work) |
| Scientist response pane | **KEEP** — already extracted (`ScientistResponsePane`) | No structural change |
| Overlay governance indicators | **KEEP** — compact inline | Not a standalone container |
| Stale / empty-state cards | **REMOVE** — D5 cleanup pass | Dead weight; confirmed non-functional |
| Data View section wrappers (legacy) | **REMOVE** — D4/D5 | Replaced by 3-workspace card taxonomy |
| Ocean-currents / air-quality research cards | **KEEP** — card taxonomy tier applied | Remain as `summary`/`research` tier cards |

---

## 3-Workspace Data View

The consolidated Data View has exactly three workspaces. No additional workspaces
may be added without a governance reviewer spec and owner approval.

| Workspace | Contents | Scroll / layout |
| --- | --- | --- |
| **Globe** | Cesium renderer; layer overlay toggles inline | Fixed height; no scroll |
| **Data** | Layer grid cards (governed layers only); health score compact header; scientist response pane when active | Vertical scroll; card taxonomy + density rules apply |
| **Detail** | Expanded card for the active layer; context annotations; @science reviewer regional answer (E2+ only) | Replaces current overlay/modal pattern |

Workspace switching is via the tab rail in the Earth+ workstation shell (D1).
No drawer, no bottom sheet, no nested tab for workspace navigation.

---

## Card Taxonomy + Density Rules

Cards in the Data workspace are classified into tiers. Tier determines display
density and what fields are shown.

| Tier | Catalog status | Shown fields | Density |
| --- | --- | --- | --- |
| `live` | `live` | Live value, trend, source, timestamp | Full card |
| `summary` | `assetBacked` / `summary` | Latest refresh value, source, vintage | Compact card |
| `research` | `research` | Layer name, source label, "data available" indicator | Micro card |
| `hidden` | `insufficientEvidence` or governance-blocked | Not shown | — |

**Density rules:**
- Maximum 3 full cards visible without scroll.
- Maximum 6 compact cards visible without scroll.
- Micro cards collapse into a grouped row when there are more than 4.
- Do not show a card for a layer with `hidden` tier — do not show a disabled
  state either. Absence is the correct representation.

---

## Globe-Inheritance Constraint Set

These constraints apply to every D-slice. Violating them requires a new governance reviewer
spec before the violation can merge.

1. **No Cesium API calls in D-slices.** D-slices touch the workstation shell,
   tab rail, and card containers — not the Cesium bridge or renderer.
2. **Globe workspace height is fixed.** D-slices must not set, animate, or
   transition the globe container height. Globe fills its fixed allocation.
3. **No new overlay rendering.** D-slices do not add canvas, WebGL, or SVG
   rendering layers over the globe. Overlay governance remains Earth agent's domain.
4. **Cesium V2.16 freeze unchanged.** No new Cesium runtime features. The V2.16
   planning freeze applies until an explicit Cesium runtime phase is approved.
5. **Earth agent merge gate.** Every D-slice PR is reviewed by Earth agent before
   merge to confirm no Cesium, catalog, or data-layer files were touched.

---

## D1–D6 Slice Plan

| Slice | Description | Gate / dependency | Status |
| --- | --- | --- | --- |
| D1 | Earth+ workstation shell — tab rail restructure; pill BOTTOM-LEFT (ruling resolved); filtered score gauge TOP-RIGHT; dark-canvas AppColors | Pill ruling resolved ✓ | **deployed** `ca91443` (R6) |
| D2 | 6→3 workspace consolidation (relocation-only); renderer readiness panel merged into shell; planetary-intelligence split deferred to D4 | D1 deployed ✓ | **gate-passed** `0381603` (R7) |
| D3 | Layer grid card taxonomy + density rules applied; detail-surface substitution (taxonomy classes deleted analyze-forced; caveat copy survives per-layer); data section wrappers removed | D2 gate-passed ✓ | **gate-passed** `fdb5b7f` |
| D4 | Detail workspace scaffold; expanded card pattern; replaces overlay/modal; planetary-intelligence surface (deferred from D2) | D3 gate-passed ✓ | **deployed** `c150405` (R7) |
| D5 | Cleanup pass — remove usage/session panels, stale empty-state cards, dead wrappers; confirm globe-inheritance constraint compliance | D4 merged ✓ | **deployed** `c150405` (R7) |
| D6 | ~~Deletion verdicts pass~~ | **SUPERSEDED** — owner visual review #1 (session 25) directed consolidate-further → IA v2 (D7+D8) rather than a standalone deletion pass. D6 scope absorbed into D7. | superseded |
| D7 | Earth View nullschool mode — no-scroll viewport-fit; globe hero; score gauge TOP-RIGHT filter-reactive; stacked proportional row; interactive time-scrubber histogram; Earth+ pill BOTTOM-LEFT persistent while sheet open | D5 deployed ✓; owner visual review #1 ✓ | **in flight** (C8) |
| D8 | Data View chart vocabulary — donut/rings, radar, streamgraph, treemap, scatter/bubble, funnel; all charts bound to real model series (no fabricated data) | D7 merged; BE series provisioned | queued (C9) |

**D7 note:** owner reference mocks are inspiration only — web extends widths
beyond mobile constraints. Design agent adapts layouts; does not pixel-match mocks.

---

## Owner Rulings — Visual Direction (Session 20, Binding)

### Earth+ Pill Corner — RESOLVED

**Owner ruling (session 20): BOTTOM-LEFT — always.**

The Earth+ pill stays at the bottom-left. Design spec recommendation (bottom-right)
was overridden by the owner. D1 pill reposition is unblocked; use bottom-left.
Do not revisit this ruling without an explicit owner directive.

### Filtered Score Gauge Position — RESOLVED

**Owner ruling (session 20): TOP-RIGHT.**

The filtered score gauge defaults to Earth (un-filtered state) and becomes
filter-reactive when a layer filter is active. Position: top-right. This is
the stable position — do not move it in D-slices without owner directive.

### Design Language — Dark Canvas, AppColors Harmonized

**Owner ruling (session 20):** visual direction = dark-canvas gauge/donut/chip
density harmonized with AppColors (owner reference images provided to Design agent).

Rules:
- Gauge, donut, and chip components use `AppColors` palette exclusively. No
  hardcoded hex values in D-slice widgets.
- Dark-canvas treatment: container backgrounds use the dark-canvas tier of
  `AppColors`, not white or light neutrals.
- Density targets are set by the reference images provided to Design agent —
  if in doubt, err toward higher information density, not whitespace.
- Design agent appends a formal design-language section to this spec (see below)
  capturing the specific <ENV_VAR>/component rules derived from the reference images.

---

## §6 — Design Language (Formally Appended Session 21)

_Formally appended per Design agent DOCS: callout (session 21), following D1 gate-pass at `3cd4255`.
<ENV_VAR> and component rules from owner reference images are authoritative for D1–D6.
Session-20 placeholder promoted to binding §6._

### Core Rules

- **AppColors only.** No hardcoded hex values in any D-slice widget. Every color
  reference must resolve to a named `AppColors` <ENV_VAR>.
- **Dark-canvas treatment.** Container backgrounds use the dark-canvas tier of
  `AppColors`. White or light-neutral backgrounds are prohibited in D-slice surfaces.
- **Density target.** Err toward higher information density, not whitespace.
  Reference images provided to Design agent are the authoritative density benchmark.

### <ENV_VAR> / Component Table

| <ENV_VAR> / Component | Rule |
| --- | --- |
| Container backgrounds | Dark-canvas tier from `AppColors` — no white, no light neutrals |
| Gauge component | Dark canvas; `AppColors` accent for filled arc; no hardcoded hex |
| Donut component | `AppColors` palette; segment colors from defined data-tier palette |
| Chip / badge | `AppColors` surface + on-surface <ENV_VAR>; no custom tint |
| Pill (Earth+) | Position: **bottom-left** (owner ruling, binding); `AppColors` primary |
| Filtered score gauge | Position: **top-right**; defaults to Earth (unfiltered); filter-reactive state uses `AppColors` filter-active <ENV_VAR> |
| Sparklines | **DROPPED** — see governance reviewer ruling below; use trend chips instead |

_If a component is not listed, use the nearest `AppColors` <ENV_VAR> and emit a `DOCS:` callout
so this table can be updated before the D-slice merges._

### governance reviewer Ruling — Sparklines (Session 23, Binding)

**Synthetic trend-shaped sparklines are dropped from D1–D6.**

- Sparklines require a real time-series. D-slices do not have access to
  per-layer historical series at the rendering layer.
- Synthetic / trend-shaped sparklines (generated from a trend direction, not
  real data) are prohibited — they misrepresent data quality to the user.
- **Replacement:** use trend chips (up/down/flat indicator; `AppColors` <ENV_VAR>)
  wherever a sparkline was specced. Trend chips are honest about their
  data-resolution level.
- A real sparkline may be introduced in a future slice only when a real
  time-series source is wired to the layer. That requires a new governance reviewer spec.

---

## Agent Boundaries

| Role | Agent | Scope |
| --- | --- | --- |
| Implementation | Design agent | D1–D8 workstation-shell + tab presentation + chart vocabulary in `worktrees\<PROJECT_ID>` |
| Integration + merge gate | Earth agent | Reviews every D-slice PR; confirms no catalog/data/Cesium files touched; merges to main; provisions BE chart series for D8 |
| Spec ratification | governance reviewer agent | Ratified this spec; amends on Design agent DOCS: callout |
| State tracking | Docs agent | Owns this file; records D-slice progress and interface contract changes |

---

## IA v2 — D7 + D8 (Session 25, Owner Directive)

_Owner visual review #1 verdict (session 25): approved direction; consolidate further → IA v2.
D6 deletion-pass superseded. D7 + D8 replace it._

### D7 — Earth View Nullschool Mode

Owner directive: the Earth View becomes a nullschool-class animated planetary
globe surface. Layout and constraints:

- **No-scroll viewport-fit.** The Earth View fills the viewport exactly; no
  vertical scroll. Every element must fit within the fixed frame.
- **Globe hero.** The Cesium globe occupies the primary visual weight. All
  other elements are secondary overlays or floating components.
- **Score gauge — TOP-RIGHT, filter-reactive.** Filtered score gauge stays
  top-right (session-20 ruling, unchanged). Defaults to Earth unfiltered state;
  becomes filter-reactive when a layer filter is active.
- **Stacked proportional row.** Layer data represented as a stacked proportional
  row beneath the globe — compact, no scroll, proportional to relative values.
- **Interactive time-scrubber histogram.** A time-scrubber histogram surface
  for temporal layer data. Interactive (tap/drag to scrub). Positioned within
  the no-scroll frame; must not push content off-screen.
- **Earth+ pill — BOTTOM-LEFT, persistent while sheet open.** Pill stays
  bottom-left (session-20 ruling). Remains visible and tappable while any
  sheet or overlay is open — do not z-index it below sheets.

**Reference mocks:** owner reference mocks are **inspiration only**. Web
extends widths beyond mobile viewport constraints. Design agent adapts
proportions and spacing to the device viewport; pixel-matching mocks is
not the goal. If a mock element cannot fit in the no-scroll frame, it is
omitted or resized — not forced.

### D8 — Data View Chart Vocabulary

Owner directive: the Data View gains a governed chart vocabulary for layer data.

**Approved chart types:**

| Chart type | Use case |
| --- | --- |
| Donut / rings | Proportional composition (e.g., VCM project-type breakdown) |
| Radar | Multi-axis layer health comparison |
| Streamgraph | Time-series flow volume (e.g., biodiversity observation density over time) |
| Treemap | Hierarchical area comparison (e.g., regional forest coverage) |
| Scatter / bubble | Two-variable correlation with optional magnitude dimension |
| Funnel | Sequential-stage attrition (e.g., data pipeline coverage) |

**Binding rule — real data only:**

Every chart in D8 must bind to a real model series. No fabricated, synthetic,
or illustrative data in any chart widget.

- **Generalization of the sparkline ruling (§6/governance reviewer, session 23):** that
  ruling covered sparklines specifically; this binding rule covers all chart
  types. Synthetic data in any chart is prohibited for the same reason:
  it misrepresents data quality to the user.
- **BE provisions series gaps.** If a layer does not yet have a time-series
  or multi-point series in the data model, Earth agent provisions a typed
  gap-aware series object (empty series with metadata) so the chart renders
  an explicit empty/loading state rather than fabricated data.
- A chart type may only be used for a layer when a real series exists in the
  model. If no series exists, the chart slot shows a loading/unavailable state.

**`DOCS:` callout required** when Earth agent provisions a new series type —
Docs agent records the series contract in this spec.
