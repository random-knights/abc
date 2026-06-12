# VCM / Carbon-Offset Data Vertical — Governance Spec

Date: 2026-06-12 (amended session 18)
Author: governance reviewer agent (spec); Docs agent (persisted per §15)
Ratified by: governance reviewer (session 17, amended session 18); owner-approved (session 16)
Assigned to: Systems agent
Status: active — slice 1 @ `70fafbf` built to original scope; slice 2 amending per session-18 scope ruling

---

## Context

VCM (Voluntary Carbon Market) / Carbon-offset is an approved data vertical for
the Earth-Systems domain. It surfaces carbon credit project data as Earth layers,
enabling users to understand carbon offset activity at a regional level.

This spec governs the structural constraints, source selection, and governance
rules that apply to any VCM implementation. These constraints exist to prevent
the vertical from being mistaken for financial advice or investment framing.

---

## Source

**Berkeley Carbon Trading Project (BCTP)** — primary source.

- Publicly available research data; academic origin, non-commercial access.
- Provides project-level carbon credit metadata: project name, region, type
  (REDD+, IFM, ARR, etc.), registry, vintage year range, issued/retired volumes.
- Does NOT provide pricing data, portfolio data, or investment performance data.
- Does NOT provide inferred entity ownership chains.

Acceptable data fields for catalog entry: project ID, region (coarse), project
type, registry name, vintage year range, volume (issued/retired, aggregate at
region level), latitude/longitude (stored for map/globe readiness — see
Geographic Readiness section). No per-project financial fields.

---

## Scope Filter (Amended Session 18)

Not all BCTP project records are in scope. Include only projects that meet:

```
(creditsIssued > 0 OR creditsRetired > 0) AND lat IS NOT NULL AND long IS NOT NULL
```

Rationale: projects with zero issued and zero retired credits have no registry
accountability signal. Projects without coordinates cannot support future
map/globe readiness. Filtering at ingest keeps the dataset meaningful.

**`creditsIssued` and `creditsRetired` are neutral registry-accountability
fields** — they record what the public registry has issued or retired, not a
price or valuation. They are permitted in models and display. They must not be
presented as a financial metric (e.g., "worth X", "valued at X").

**Permanently banned financial fields** (unaffected by this amendment):
`price`, `pricePerTonne`, `valuation`, `currency`, `marketValue`, `marketCap`,
`return`, `yield`, `opportunityCost`, `roi`, and any field that names a
monetary amount.

---

## Structural No-Investment-Framing Rule (Non-Negotiable)

This is the governing constraint for the entire VCM vertical. It applies at
every layer: data models, catalog entries, display widgets, @science reviewer context.

**Banned from all models and display:**

- Price per tonne (current or historical)
- Market value, market cap, or valuation of any credit batch
- Portfolio allocation or weighting
- Return on investment, yield, or performance
- Any field that implies the user can or should purchase credits through the app

**Banned terms** (must not appear in any user-visible string, `@science reviewer`
response context, or Earth layer description):

> "invest", "investment", "buy", "purchase", "portfolio", "return", "yield",
> "profit", "financial performance", "market value", "price", "valuation",
> "currency", "opportunity cost"

Implementation note: apply banned-term enforcement at the governance layer
(a named, independently testable function, not inlined in a widget) before any
VCM data reaches the display layer or @science reviewer context assembly. This mirrors
the biodiversity suppression guard pattern — it is a structural precondition,
not a follow-up.

---

## Coarse Regions Only

VCM catalog entries aggregate at coarse region level (country or multi-country
area) for display and @science reviewer context.

Rationale: coarse aggregation (e.g., "South America — Brazil / Peru corridor")
is sufficient for Earth layer context and avoids inadvertent entity exposure
via precise land-parcel identification.

---

## Geographic Readiness — Lat/Long Stored, No Rendering (Session 18)

Project-level latitude/longitude coordinates are stored in the data model for
future map/globe readiness. They are **not rendered** at this stage.

Rules:

- `lat` and `long` are stored on the `VcmProjectRecord` (or equivalent) model.
- No coordinate rendering in the Earth layer, Data View card, or any widget
  until an explicit map/globe rendering phase is approved.
- Globe rendering is frozen at Cesium V2.16. Do not implement coordinate
  rendering without a new Cesium phase and an explicit owner directive.
- The `summary`/`research` catalog status for the VCM layer reflects this:
  data is available and registry-accountable, but the layer is not yet
  map/globe-ready. Do not promote to `live` without rendering phase approval.

---

## No Inferred Entity Links

VCM data must not infer or surface any link between a carbon project and a
specific company, fund, or owner entity.

- Do not join VCM project records to any entity registry (including future
  Entities domain entries) at the data layer without an explicit governance phase.
- @science reviewer context may reference project types and regional volumes; it must
  not attribute volumes to named entities.
- Extension point: if a future governance phase explicitly approves
  source-backed entity linking (e.g., a registry entry that is itself a
  public-domain entity record), that phase requires a new governance reviewer spec.

---

## Extension Point — Source-Backed Entities Only

The VCM vertical may eventually connect to the Entities domain (owner-approved,
session 16) for named registry bodies (e.g., Verra, Gold Standard). This is
permitted only if:

1. The entity is a public-domain registry body, not a fund, company, or
   private entity.
2. The link is sourced from the public registry's own data (not inferred).
3. An explicit governance phase has been approved for the link.

Do not implement entity linking without all three conditions met and a governance reviewer
spec on record.

---

## Implementation Order

| Step | Description | Gate |
| --- | --- | --- |
| 1 | Systems agent data vertical: BCTP source adapter, coarse-region aggregation, asset-backed refresh; scope filter (creditsIssued>0 OR creditsRetired>0 AND lat/long present) | Banned-term guard implemented as named testable function before merge. **Slice 1 @ `70fafbf` built to pre-amendment spec — slice 2 applies scope filter + lat/long storage** |
| 2 | Earth agent catalog registration: `earth_source_vcm_catalog.dart` entry via `EARTH:` delta | Registration applied after Systems slice merges |
| 3 | Earth agent layer wire-up: Data View card for VCM layer | No financial fields; no entity links; governance tests added |

---

## Sequencing Constraint

Biodiversity (`e9f9e47`) is now deployed at `4148495` — VCM sequencing constraint
is unblocked. Systems agent is active on VCM slice 2.
