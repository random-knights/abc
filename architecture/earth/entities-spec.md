# Entities Domain — Spec (E1)

Date: 2026-06-12
Author: governance reviewer agent (spec); Docs agent (persisted per §15)
Ratified by: governance reviewer (session 17); owner-approved (session 16)
Assigned to: Connect agent
Status: E1 active — slices 1–3 deployed @ `1702eaa`; slice 4 (minimal) gate-passed `af62d6f` (R6 bundle)

---

## Context

Entities is an owner-approved domain (session 16) assigned to Connect agent.
It enables named entities (species, organizations, projects, registry bodies)
to be associated with Earth layers, regions, and Connect sources — providing
structured context beyond raw data feeds.

Prerequisite: Connect source intake pipeline (`c2-0`) at `3ab6786` — deployed
in Production Release `27393039706`. Entity intake depends on the same
registry infrastructure.

---

## Governing Rule — Unsourced Mappings Unrepresentable

**The core invariant of E1:** every entity-to-source or entity-to-region
mapping must be traceable to an explicit, named, public-domain source record.

- Unsourced mappings may not be stored, displayed, or passed to @science reviewer.
- "Inferred" or "derived" entity links (e.g., inferring that a carbon project
  is owned by an entity based on proximity or name matching) are prohibited
  without an explicit governance phase.
- An entity record with no source citation is unrepresentable in the catalog —
  it must not be created, even as a stub.

This rule applies at the data model layer. The `EntityDefinition` (or
equivalent) must carry a required `sourceRef` field pointing to the named
public-domain record. Absence of a `sourceRef` must be a hard model error,
not a nullable field.

---

## E1 Scope

E1 covers the foundational intake and registry layer for Entities. It does not
cover full UI surfacing or @science reviewer entity context (those are E2+ phases).

| Slice | Description | Status |
| --- | --- | --- |
| 1 | Entity model (`EntityDefinition`) with mandatory `sourceRef`; unsourced mapping guard; Connect intake pipeline integration | **Deployed ✓** (`4148495`) |
| 2 | Entity-to-region mapping; entity-to-source association | **Deployed ✓** (`4148495`) |
| 3 | Resolver contract — Connect owns resolver; Earth owns consumption (see Earth/Connect Boundary below) | **Deployed ✓** (`1702eaa`) |
| 4 | Minimal catalog registration via `EARTH:` delta | **gate-passed** `af62d6f` — R6 bundle |
| 5+ | Full resolver wiring (E1→Earth consumption); @science reviewer entity context (E2+) | R7 bundle |

---

## Entity Types (Approved for E1–E2)

| Type | Examples | Source constraint |
| --- | --- | --- |
| Registry body | Verra, Gold Standard, IUCN | Public registry's own data |
| Species | IUCN Red List entries | IUCN Red List API (keyless) or GBIF |
| Protected area entity | WDPA site record | WDPA metadata (already deployed) |

Entity types not in this list require a separate governance reviewer spec before
implementation.

---

## Earth / Connect Resolver Boundary (Session 18, Binding)

Slice 3 introduces the resolver contract between Connect and Earth. The
boundary is:

- **Connect owns the resolver.** Connect agent implements and maintains the
  entity resolver service — the component that looks up, validates, and returns
  `EntityDefinition` records by ID or query. Connect is the sole writer of the
  resolver interface.
- **Earth owns consumption.** Earth agent calls the resolver to populate entity
  context in Earth layers, Data View cards, and @science reviewer context assembly.
  Earth does not re-implement resolution logic — it calls the Connect-owned
  interface.
- **No cross-ownership.** Earth must not write to the resolver; Connect must
  not directly assemble Earth layer context. If a change requires both sides,
  the interface contract is updated first (governance reviewer spec or owner directive), then
  each agent applies their side.
- **Interface contract changes** require a `DOCS:` callout so Docs agent can
  record the revision in this spec before implementation proceeds.

---

## Relationship to Other Domains

- **VCM:** VCM may reference registry body entities (Verra, Gold Standard)
  if source-backed and a governance phase is approved (see
  [`architecture/vcm-governance-spec.md`](vcm-governance-spec.md)).
- **Connect:** entity intake uses the Connect source intake pipeline as
  infrastructure (`c2-0` at `3ab6786`).
- **Earth catalog:** entity registration follows the catalog non-touch rule
  (§8) — Connect emits `EARTH:` delta; Earth applies.
- **@science reviewer:** entity context may be passed to @science reviewer only in E2+ and
  only for source-backed, non-sensitive entity records. No entity context in E1.

---

## Governance Constraints

- No entity linking to VCM projects without explicit governance phase (see
  VCM spec).
- No precise geographic coordinates for entity records — coarse region only.
- Endangered species entity records must inherit the biodiversity suppression
  guard (see [`architecture/environmental-data-vertical-audit.md`](environmental-data-vertical-audit.md) §Biodiversity)
  before any location-adjacent field is exposed.
- Catalog registration: no `EntityDefinition` reaches the Earth catalog without
  a governance reviewer governance spec on record for that entity type.
