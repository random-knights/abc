# Human Activity Data Vertical — Governance Amendment

Date: 2026-06-12 (session 24)
Author: Docs agent (owner directive + governance reviewer ratification per session 24)
Prior state: Human Activity freeze — all tiers BANNED (coordination standards §4)
Amendment: Tiers 1 + 2 LIFTED; Tier 3 REMAINS BANNED

---

## Tier Classification

### Tier 1 — Symbolic Motion Cues (LIFTED — RETAINED GLOBE INVENTORY)

Symbolic, static representations of motion infrastructure. No live data.

**Permitted:**
- Static transport corridors (major shipping lanes, air corridors, satellite
  orbital bands) rendered as fixed geometry on the globe.
- Motion cues are purely symbolic — they represent the existence of traffic
  infrastructure, not real-time or recent vehicle positions.
- Implementation: static vector data baked at build time or asset-backed
  refresh (no live API calls for positional data).

**Hard constraints:**
- No live position data of any kind.
- No timestamps fresher than a full calendar season (symbolic, not temporal).
- Geometry is corridor/band/lane level — not individual vehicle paths.

**Globe inventory note:** the motion suite (corridors/lanes/orbital bands) is
classified as **RETAINED GLOBE INVENTORY**. Design agent D6 deletion-verdicts
pass must NOT quarantine or remove motion-suite assets. Confirm with Earth agent
before any D6 deletion of globe geometry files.

---

### Tier 2 — Aggregate Density Verticals (LIFTED — Governed)

Aggregate density surfaces for public transport datasets: commercial flights,
maritime vessels, satellites. Treated as Earth-Systems data verticals; same
structural pattern as VCM, biodiversity, and ocean.

**Permitted datasets:**
| Dataset | Source class | Notes |
| --- | --- | --- |
| Commercial flights density | Public aviation feeds (e.g., OpenSky, FAA open data) | Aggregate only; no schedule data |
| Maritime vessel density | AIS public datasets (e.g., MarineTraffic open, NOAA) | Aggregate only |
| Satellite orbit density | Public TLE feeds (e.g., CelesTrak, Space-Track open) | Aggregate only |

**Structural identity suppression — non-negotiable:**

The following fields are **never representable** in any model, catalog entry,
display widget, @science reviewer context, or data file:

- Flight: callsign, tail number, registration, flight number, airline name
  (airline name may appear in aggregate context as a category label only —
  not linked to a specific track)
- Maritime: MMSI, IMO number, vessel name, flag state per-vessel
- Satellite: NORAD catalog ID, satellite name, operator (operator may appear
  as a category label at aggregate level only)

Any field that could identify or track a specific vehicle is prohibited.
This constraint is **structural** — enforce at the data-adapter layer as a
named, independently testable suppression function (mirrors biodiversity
suppression guard and VCM banned-term guard patterns).

**Aggregate / coarse-cell requirement:**
- Data is aggregated to coarse geographic cells (≥1° × 1° grid or equivalent).
- No sub-cell resolution that would allow single-vehicle inference.

**Delay floor — minimum ≥24 hours:**
- No data fresher than 24 hours in any Tier 2 density surface.
- The delay floor is enforced at ingest — not as a display-time filter.
- Asset-backed refresh cadence must respect this floor.

**Fail-closed:**
- If suppression function fails, the layer returns empty — not partial data.
- Same pattern as biodiversity suppression guard (`fail-closed` catalog status).

**Health/trend-neutral:**
- Tier 2 layers do not contribute to the Earth health score or trend.
- `influencesEarthHealthScore = false`, `influencesEarthTrend = false`.

**Governance spec required:** each Tier 2 vertical (flights, ships, satellites)
requires a separate governance reviewer governance spec before implementation, following the
VCM governance spec pattern. No catalog entry without an approved spec.

---

### Tier 3 — Live Per-Vehicle Tracking (REMAINS BANNED)

**Permanently banned.** No implementation without an explicit future owner
directive + new governance reviewer governance spec.

Banned:
- Real-time or near-real-time individual vehicle positions (any transport mode)
- Historical tracks of identified vehicles
- Any surface that enables tracking a specific flight, vessel, or satellite

This tier is frozen indefinitely. The Tier 1 / Tier 2 lift does not affect
Tier 3. Do not interpret the Tier 2 delay floor as a path to Tier 3 — they
are separate classifications.

---

## Implementation Order (Within Cesium Phase)

Tier 1 symbolic motion cues are part of the Cesium globe phase (C8–C10 in
the roadmap). Tier 2 density verticals follow the Earth-Systems vertical
pattern and are scheduled at C9.

| Phase | Tier | Work |
| --- | --- | --- |
| C8 | — | Cesium base globe; country boundaries; vector adapter foundation |
| C9 | 2 | First Tier 2 vertical (flights or ships density — governance reviewer spec required) |
| C10 | 1 | Symbolic motion cues (corridors/lanes/orbital bands) on globe |
| Post-R8 | 2 | Additional Tier 2 verticals as governance specs are ratified |

---

## Relationship to Existing Constraints

- **Cesium V2.16 freeze:** unchanged. No new Cesium runtime features until the
  Cesium phase is explicitly opened (C8). This amendment does not open Cesium early.
- **Earth layer taxonomy (§4 coordination standards):** Human Activity status
  updated from FROZEN to TIER-1/2-LIFTED (see coordination standards amendment).
- **VCM governance pattern:** Tier 2 verticals follow the same structural
  pattern — banned-term/banned-field guard as named testable function,
  implemented before any catalog entry.
- **D6 deletion verdicts:** motion-suite assets in the globe renderer are
  RETAINED. D6 must not remove them. Earth agent confirms before any D6 deletion.
