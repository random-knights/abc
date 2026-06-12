# Environmental Data Vertical — Audit

Date: 2026-06-11
Author: Systems agent (audit); Docs agent (persisted per §15)
Ratified by: governance reviewer (session 14)
Branch: `earth/data-environmental-audit` (audit-only; no code changes)
Status: findings ratified — implementation order approved

---

## Scope

Audit of three Environmental taxonomy groups for live-source vs asset-backed
feasibility, governance constraints, and implementation readiness. Covers
forest cover, biodiversity/habitat, and protected areas. Human Activity remains
frozen per overlay governance and is not in scope here.

---

## Forest Cover

**Verdict: asset-backed refresh (approved for implementation)**

- **Source:** GLAD/Hansen Global Forest Watch annual raster data.
- **Cadence:** annual asset refresh. Not a live feed.
- **GFW live-via-proxy:** technically possible but deferred to future-infra phase.
  Do not implement a live proxy to Global Forest Watch API without an approved
  infrastructure phase covering rate limits, caching strategy, and cost model.
- **Governance:** no overlay governance conflicts. Forest cover is trend-neutral
  for health scoring (consistent with air-quality pattern).
- **Implementation:** asset-backed `EarthLayerDefinition` with annual refresh
  fixture. No live provider registration at this stage.

---

## Biodiversity / Habitat

**Verdict: live-capable with preconditions (deferred until preconditions met)**

- **Source:** GBIF (Global Biodiversity Information Facility) — keyless public API,
  coarse aggregate queries only.
- **Query shape:** grid-cell aggregate counts (species richness per cell);
  no species-level occurrence records, no precise coordinates.
- **Precondition — endangered-location suppression guard (non-negotiable):**
  A structural, test-covered suppression guard must be in place before any
  GBIF integration ships. The guard must:
  - Filter out occurrence records for IUCN Red List Endangered / Critically
    Endangered species from any response payload before it reaches the UI.
  - Be implemented as a named, independently testable service function (not
    inlined in a widget or page).
  - Have at least one test asserting suppression of a synthetic endangered
    record and one asserting pass-through of a non-endangered record.
  - This guard is a **structural precondition**, not a follow-up. Do not merge
    a biodiversity layer without it.
- **Governance:** endangered-location suppression is an overlay governance
  requirement (consistent with §4 taxonomy table). Coarse-aggregate-only
  constraint must be enforced at the query layer, not just the display layer.
- **Implementation order:** forest → protected-areas → biodiversity. Biodiversity
  is last because its precondition (suppression guard) adds implementation
  complexity. Do not reorder without governance reviewer PM approval.

---

## Protected Areas

**Verdict: asset-backed refresh (approved for implementation)**

- **Source:** WDPA (World Database on Protected Areas) — monthly snapshot.
- **Data shape:** metadata and integrity fields only (name, IUCN category,
  status, area km²). **No boundary geometry.** Geometry is excluded on
  governance grounds (boundary data enables precise location exposure for
  sensitive habitats — consistent with overlay governance policy).
- **Cadence:** monthly asset refresh. Not a live feed.
- **Governance:** metadata-only constraint is structural. Do not add boundary
  geometry to the WDPA integration without an explicit governance phase.
- **Implementation:** asset-backed `EarthLayerDefinition` with monthly refresh
  fixture. Metadata fields only in the catalog entry.

---

## Implementation Order (governance reviewer-ratified)

| Phase | Group | Type | Key constraint |
| --- | --- | --- | --- |
| 1 | Forest cover | Asset-backed refresh | Annual GLAD/Hansen; no live proxy yet |
| 2 | Protected areas | Asset-backed refresh | WDPA monthly; metadata only; no geometry |
| 3 | Biodiversity/habitat | Live-capable | Suppression guard precondition must be met first |

---

## Deferred / Out of Scope

- **GFW live-via-proxy:** future-infra phase required before implementation.
- **Species-level GBIF occurrence records:** not in scope; coarse aggregates only.
- **Boundary geometry for protected areas:** excluded by overlay governance.
- **Human Activity layers:** frozen per overlay governance; not in this audit.

---

## Open Question — Glaciers Layer Catalog Status

Earth agent flagged that the glaciers layer intentionally stays `research` while
its source metadata is connected (`assetBacked` / `previewFixture` access).
Systems agent to confirm or amend via `EARTH:` registration delta.

Until Systems confirms: glaciers catalog status remains `research`. Do not
promote to `assetBacked` without Systems sign-off recorded in a delta callout.
