# P9 Glacier Provider Contract

Date: 2026-06-01

Scope: architecture contract only. This document does not authorize runtime provider integration, APIs, Firebase Functions, OAuth, maps, overlays, command execution changes, deploys, or package changes.

## Read First

- `<LOCAL_WORKSPACE_PATH>`
- `<LOCAL_WORKSPACE_PATH>`

## Current Runtime Audit

Current Glaciers implementation remains provider-free and read-only:

- Model: `<LOCAL_WORKSPACE_PATH>`
- UI card: `<LOCAL_WORKSPACE_PATH>`
- Earth source metadata: `<LOCAL_WORKSPACE_PATH>`
- Source catalog metadata: `<LOCAL_WORKSPACE_PATH>`
- Tests: `<LOCAL_WORKSPACE_PATH>` and `earth_source_registry_test.dart`

Current layer state:

- Layer id: `glaciers`
- Status: `research`
- Source type: `Cryosphere / Ice Mass / Glacier Monitoring`
- Future phase shown in-app: `P9.20`
- Provider candidates: NASA Earthdata, NSIDC, USGS EarthExplorer, WGMS
- Current metric placeholders: Ice Extent, Glacier Mass Balance, Meltwater Signal, Source Freshness
- Current values: `Not Yet Connected`

The app currently contains no glacier API calls, no Firebase glacier callable, no map overlays, no coordinate display, and no provider authentication flow.

## Provider Evaluation

### NASA Earthdata

Role:

- Best broad source for future glacier-adjacent satellite and cryosphere datasets.
- Useful for long-term terrain, ice extent, imagery, and derived Earth observation context.

Access model:

- Likely OAuth or Earthdata Login backed by a server-side boundary.
- Client-side direct access is not recommended for the first implementation.

Strengths:

- Authoritative, broad dataset catalog.
- Strong fit with existing Earth source registry.
- Can support long-term Glacier, Terrain, Carbon, and Earthdata-backed roadmap work.

Risks:

- Dataset discovery and harmonization can be complex.
- Different products have different cadence, spatial resolution, and license/attribution expectations.
- Auth/<ENV_VAR> handling should not live in Flutter web.

Recommendation:

- Use as Phase 2 or long-term provider after a smaller metadata-first MVP proves the UX and cache model.

### NSIDC

Role:

- Strong candidate for glacier, snow, ice, and cryosphere datasets.
- Good fit for ice extent and glacier monitoring metadata.

Access model:

- Dataset-dependent. Some access paths may require Earthdata Login/OAuth, while catalog or metadata access may be public.
- Treat as server-proxied unless the exact endpoint is confirmed to be anonymous and browser-safe.

Strengths:

- Domain-specific cryosphere authority.
- Better semantic match for Glaciers than generic satellite catalogs.
- Good candidate for first provider-backed ice extent or glacier inventory summaries.

Risks:

- Dataset-specific interpretation required.
- Some products may be large, gridded, or unsuitable for direct web consumption.
- Attribution and product-version labels must be explicit.

Recommendation:

- Recommended MVP provider, but only for metadata/summary fields and not raw gridded data.

### USGS EarthExplorer

Role:

- Useful satellite and terrain search/discovery source that can support glacier-adjacent imagery and land-surface context.

Access model:

- Likely authenticated API or account-backed access for practical automation.
- Should use server-side proxy if implemented.

Strengths:

- Strong fit for terrain/glacier imagery discovery and historical comparison context.
- Complements Terrain readiness work.

Risks:

- More useful for dataset search than a simple glacier summary.
- Can pull the product toward imagery/map processes before the Earth layer is ready.

Recommendation:

- Defer to Phase 2 after NSIDC/WGMS summary contracts are stable.

### WGMS

Role:

- Best candidate for glacier mass-balance and monitoring summaries.

Access model:

- Current catalog marks auth type as `none`; verify exact data access terms before implementation.
- Prefer cache-first ingestion even if no key is required.

Strengths:

- Directly aligned with glacier mass balance.
- Likely better for educational summary metrics than raw satellite data.
- Lower auth complexity if approved data endpoints remain public.

Risks:

- Update cadence may be slower than satellite products.
- May require careful attribution and explanation that values are observational/compiled, not live.

Recommendation:

- Recommended MVP companion source with NSIDC: WGMS for mass balance, NSIDC for ice/cryosphere metadata.

## Recommended MVP Provider

MVP should use a conservative metadata-summary approach:

1. Primary MVP source: WGMS for mass-balance-oriented metadata and educational summaries.
2. Secondary MVP source: NSIDC for cryosphere/ice extent metadata if a safe public or server-proxied endpoint is identified.
3. Defer NASA Earthdata and USGS EarthExplorer to Phase 2 unless their metadata endpoints prove simpler than NSIDC.

MVP should not retrieve raw gridded data, imagery, coordinates, or map-ready layers. It should return only bounded educational summaries:

- Ice extent status label
- Glacier mass balance status label
- Meltwater signal context label
- Dataset version or publication year
- Source freshness label
- Attribution text
- Safe provider health state

## Source Access Model

Preferred architecture:

- Firebase callable proxy for any authenticated, <ENV_VAR>-bearing, large, or policy-sensitive provider.
- Cache-first behavior before provider fetch.
- Client receives summary-only data.
- Client never receives provider <ENV_VAR>, raw provider responses, coordinates, or large dataset payloads.

Potential callable:

```text
getGlacierSummary
```

Inputs:

- approved region preset only
- optional dataset family id from an allowlist
- no raw bounding boxes in MVP
- no arbitrary provider URLs

Outputs:

- summary values only
- provider attribution
- dataset version/publication date
- freshness age
- provider health
- cache status
- safe user-facing message

## Auth And Key Requirements

MVP:

- WGMS: use no-auth metadata only if terms allow; otherwise proxy and cache.
- NSIDC: treat as OAuth/Earthdata-login capable until proven otherwise.

Phase 2:

- NASA Earthdata: server-side OAuth/Earthdata Login flow or approved service boundary.
- USGS EarthExplorer: server-side authenticated API only if required.

Rules:

- No provider <ENV_VAR> in Flutter web.
- No OAuth <ENV_VAR> in local logs.
- No raw provider errors exposed to users.
- No provider access added without explicit implementation phase approval.

## Cache And Freshness Rules

Glacier data is slow-moving compared with weather or fire data. Prefer long-lived cache windows.

MVP cache:

- Cache dataset metadata and summary responses for 24 hours minimum.
- Allow longer cache windows for annual/static products.
- Always display dataset version/publication date when available.
- Display freshness as `current dataset`, `cached`, `stale`, or `unavailable`.

Provider fetch:

- Cache-before-provider-call.
- On provider failure, return stale cached summary if available.
- If no cache is available, return a safe unavailable state.

Never imply real-time glacier monitoring unless the source explicitly supports it.

## Safe Error Handling

Callable/provider failures should map to safe user-facing states:

- Provider unavailable: "Glacier data is temporarily unavailable."
- Stale cached data: "Cached glacier dataset summary shown."
- Unsupported region: "This glacier region is not available yet."
- Malformed source data: "Glacier source data could not be read safely."
- Auth/key issue: "Glacier source is not configured yet."

Internal logs may include provider error category and request id, but must not include <ENV_VAR>, raw payloads, or <ENV_VAR> values.

## Attribution

Every glacier summary must include attribution:

- Provider name
- Dataset/product name where available
- Dataset version or publication date where available
- Link to provider documentation or dataset landing page

Suggested attribution priorities:

- WGMS: cite WGMS and dataset/database version.
- NSIDC: cite NSIDC product and version.
- NASA Earthdata: cite dataset/product and DAAC if available.
- USGS: cite USGS EarthExplorer/product source.

## Privacy And Security Notes

- Glacier summaries are public/environmental data and should not require user personal data.
- Authenticated app access should still be required if exposed through app-only Firebase callables.
- Do not log user location for glacier summaries.
- Do not accept arbitrary provider URLs, bounding boxes, or raw query strings from the client.
- Do not expose exact coordinates in MVP.
- Do not mix glacier provider work with command execution or agent source access.

## Testing Strategy

MVP tests should cover:

- Glacier source registry mapping integrity.
- Approved region preset validation.
- Cache hit response.
- Cache miss/provider success response.
- Provider failure with stale cache.
- Provider failure without cache.
- Malformed source payload handling.
- Attribution presence.
- No coordinates/raw provider payload in client model.
- User-facing copy for unavailable/stale/malformed states.

Flutter/UI tests should verify:

- Glaciers card replaces placeholder metrics with summary values only when data exists.
- Readiness state remains clear when provider is unavailable.
- Source freshness and attribution render.
- Existing Weather, Wind, Wildfires, Carbon, Tree-Time, Ocean, Flights, Ships, and Terrain behavior is unchanged.

## Rollback Strategy

- Keep current readiness-only `EarthGlaciersModel.readiness` as fallback.
- Gate live glacier summary display behind successful summary load.
- If callable fails or provider contract changes, show readiness copy and `Not Yet Connected`/unavailable labels.
- Roll back by removing the callable wiring while preserving source registry metadata.
- Do not remove the Glaciers card or existing readiness tests during rollback.

## Recommended Roadmap

### MVP Glacier Implementation

- Add a summary-only glacier model.
- Add a provider observability model reuse path.
- Add `getGlacierSummary` callable only if provider access requires server boundary.
- Use WGMS and/or NSIDC metadata summaries.
- Display Ice Extent, Glacier Mass Balance, Meltwater Signal, Source Freshness, provider health, and attribution.
- No maps, overlays, coordinates, raw payloads, or arbitrary regions.

### Phase 2

- Add NASA Earthdata or USGS EarthExplorer metadata if needed for dataset discovery.
- Add approved region presets.
- Add dataset version comparison labels.
- Add stronger cache/freshness detail.
- Evaluate whether Terrain and Glaciers can share Earthdata/USGS source plumbing.

### Long-Term

- Support map/overlay planning only after Earth rendering architecture is approved.
- Add multi-provider comparison if attribution and methodology are clear.
- Add climate trend explanations with uncertainty and dataset version labels.
- Explore agent QUERY previews for glacier summaries only after source-access governance is approved.

## P9.23 Recommendation

Before implementing glacier runtime access, run:

```text
P9.23 Glacier Summary MVP Provider Spike
```

Recommended spike goals:

- Confirm WGMS and NSIDC endpoint/data access terms.
- Identify one safe metadata endpoint or downloadable summary product.
- Prototype parser off-app or in a branch-only sandbox.
- Compare payload shape to proposed summary model.
- Do not add runtime app integration until provider access and attribution are proven.

## P9.24 Spike Review Findings

Spike branch:

```text
<LOCAL_WORKSPACE_PATH>
spike/glacier-summary-mvp
```

Spike commit reviewed:

```text
83d58c1 feat: spike glacier summary provider preview
```

### What The Spike Proved

The branch proved an app-local, summary-only glacier path can fit the existing
Earth architecture without adding providers, Firebase Functions, maps, overlays,
raw gridded data, or client-side <ENV_VAR>.

Production-shape pieces that look reusable:

- `EarthGlacierSummary` can represent bounded summary data:
  - provider
  - source data id
  - monitored region count
  - mass-balance signal
  - observation period
  - provider freshness
  - source attribution
  - generated timestamp
  - warnings
  - provider health/freshness/cache status
- Schema validation correctly rejects malformed payloads and missing source
  metadata/attribution.
- Empty summary state is representable with `monitoredRegionCount == 0`.
- The service seam is useful:
  - `EarthGlacierSummaryService`
  - fixture-backed implementation
  - injected Glaciers card loader
- The Glaciers card can reuse existing provider observability presentation.
- UI labeling can keep the layer honest with explicit:
  - preview
  - provider spike
  - not production
- Test coverage now demonstrates:
  - model parsing
  - empty state
  - malformed source data rejection
  - attribution requirement
  - provider health/freshness parsing
  - Glaciers card success and failure rendering

### What The Spike Did Not Prove

The spike does not prove live provider readiness.

Still blocked:

- WGMS live endpoint certainty.
- NSIDC endpoint certainty.
- Provider terms and attribution requirements.
- Dataset version/publication metadata shape.
- Real payload schema stability.
- Real cache/freshness behavior.
- Region preset semantics.
- Server-side proxy requirements.
- Provider failure taxonomy from real source responses.

The fixture payload is intentionally synthetic and must not be treated as live
provider evidence.

### Contract Alignment

The spike aligns with this contract by keeping glacier data:

- summary-only
- read-only
- attribution-required
- provider-observability-aware
- map-free
- overlay-free
- <ENV_VAR>-free
- isolated from command architecture

The spike intentionally stops short of `getGlacierSummary`, OAuth, provider
calls, raw payload ingestion, and production route behavior.

### Merge Recommendation

Do not merge the spike to `main` as production behavior yet.

Keep the spike branch open as a reviewed implementation reference until a
provider-validation task proves at least one real data path.

Acceptable merge conditions:

1. Replace fixture payload with a provider-validated or proxy-validated summary
   source.
2. Preserve the summary-only client model.
3. Preserve explicit attribution rendering.
4. Preserve safe malformed/empty/unavailable states.
5. Preserve provider health/freshness display.
6. Add tests using real captured, redacted, non-<ENV_VAR> fixture samples from the
   approved provider path.

If live provider validation remains blocked, close the spike after extracting
the model and UI lessons into a future implementation ticket.

### Recommended Provider Validation Path

Run a dedicated provider-validation phase before production implementation:

```text
P9.25 Glacier Provider Validation
```

Scope:

- Verify WGMS data access terms and exact downloadable/API surface.
- Verify whether NSIDC can provide a browser-safe public metadata endpoint or
  requires Earthdata/OAuth/server proxy access.
- Capture small, non-<ENV_VAR> sample payloads.
- Define required attribution strings.
- Define dataset version/publication-date fields.
- Decide whether MVP can remain app-local fixture-backed for demonstration or
  requires a Firebase callable proxy.
- Do not merge the spike or expose live behavior until these checks are
  complete.

Recommended outcome gates:

- If WGMS exposes a stable, public, summary-suitable source, implement a
  cache-first parser/proxy path.
- If WGMS is download/catalog/manual only, use a Firebase callable or static
  curated dataset build step rather than direct Flutter web access.
- If NSIDC requires Earthdata Login/OAuth, defer NSIDC to Phase 2 unless a
  server-side proxy is explicitly approved.

## P9.25 Provider Validation Findings

Validation date: 2026-06-01

Validation branch/workspace:

```text
<LOCAL_WORKSPACE_PATH>
spike/glacier-provider-validation
```

Local proof script:

```text
<LOCAL_WORKSPACE_PATH>
```

The script is read-only. It does not download raw glacier datasets, does not
require <ENV_VAR>, does not call Firebase, and does not write files. It validates
official WGMS metadata pages and performs a `HEAD` request against the current
WGMS FoG zip only to capture small download metadata.

### Provider Validation Summary

#### WGMS

Status: selected MVP candidate, metadata-validated only.

Official findings:

- WGMS Data Exploration states WGMS data is freely available for scientific and
  educational purposes, with acknowledgement required to WGMS and/or original
  investigators and sponsoring agencies according to available metadata.
- WGMS Data Exploration states the FoG Browser allows direct download of minimal
  glacier-change data series, while larger datasets can be ordered by email.
- WGMS documents OGC WFS/CSW services for Fluctuations of Glaciers metadata.
- The current WGMS FoG database version is:
  - DOI: `https://doi.org/10.5904/wgms-fog-2026-02-10`
  - release date: `2026-02-10`
  - publication year: `2026`
  - format: CSV files, zipped
  - reported size: `868 MB`
  - spatial coverage: global
  - temporal coverage: `1127-2026 AD`
  - rights: open access under correct citation

Local validation findings:

- The database page and data exploration page are reachable without <ENV_VAR>.
- The current zip URL responds to a `HEAD` request with:
  - status `200`
  - content type `application/zip`
  - compressed content length `39,137,587` bytes
- The proof script deliberately does not download the zip because the provider
  page reports a large raw dataset and this phase only allows small summary
  samples.
- WGMS-hosted WFS links listed on the official data exploration page returned
  `404` during local validation. Treat direct WFS access as unresolved until
  WGMS confirms the active endpoint/path or an alternate hosted service.

Sample payload shape proven by metadata validation:

```json
{
  "provider": "WGMS",
  "selectedDataset": {
    "title": "Fluctuations of Glaciers (FoG) Database",
    "doi": "https://doi.org/10.5904/wgms-fog-2026-02-10",
    "publisher": "World Glacier Monitoring Service (WGMS)",
    "publicationYear": "2026",
    "releaseDate": "2026-02-10",
    "rights": "Open access under the requirement of correct citation",
    "dataFormat": "CSV files, zipped",
    "reportedDataSize": "868 MB",
    "spatialCoverage": "Global",
    "temporalCoverage": "1127-2026 AD"
  },
  "downloadProbe": {
    "statusCode": 200,
    "contentType": "application/zip",
    "compressedContentLengthBytes": 39137587,
    "downloaded": false
  },
  "validationResult": {
    "metadataValidated": true,
    "payloadValidated": false,
    "requiresProductionProxyOrBuildStep": true
  }
}
```

Attribution wording for MVP:

```text
WGMS (2026): Fluctuations of Glaciers (FoG) Database. World Glacier Monitoring Service (WGMS), Zurich, Switzerland. https://doi.org/10.5904/wgms-fog-2026-02-10
```

MVP implication:

- WGMS is the best candidate for first glacier summary work.
- Do not use direct Flutter web access to the full dataset.
- Implement a summary-only Firebase callable or curated static build step that
  converts WGMS raw data into bounded app payloads.

#### NSIDC

Status: rejected for MVP direct runtime access; keep as Phase 2 candidate.

Official findings:

- NSIDC says NASA Earth science data managed by NSIDC requires a free NASA
  Earthdata Login account.
- NSIDC says users must cite data products, and each dataset landing page
  provides DOI/citation details.
- NSIDC programmatic access guidance states NSIDC DAAC data access requires
  Earthdata Login.

MVP implication:

- NSIDC is strong for cryosphere/ice extent metadata, but it should not be used
  by Flutter web directly.
- Treat NSIDC as Phase 2 behind a server-side Earthdata-authenticated boundary
  unless a specific public non-auth metadata endpoint is approved.

#### NASA Earthdata / CMR

Status: rejected as MVP data source; useful for discovery and Phase 2 metadata.

Official findings:

- CMR Search supports collection and granule metadata queries.
- CMR granule queries must target a subset of collections using parameters such
  as provider, concept id, collection concept id, short name, version, or entry
  title.
- Earthdata/CMR is better suited to discovery/catalog processes than the first
  glacier summary MVP.

MVP implication:

- Use CMR later to discover or validate NSIDC/NASA collection metadata.
- Do not use CMR as the first app summary provider unless a bounded collection
  and exact summary calculation are already defined.

#### USGS EarthExplorer / M2M

Status: rejected for MVP direct runtime access; keep as terrain/glacier imagery
Phase 2 candidate.

Official findings:

- USGS M2M is a RESTful JSON API for searching and acquiring USGS/EROS data
  inventories and retrieving metadata/download URLs.
- USGS documents application-<ENV_VAR> authentication through `login-<ENV_VAR>` for M2M.

MVP implication:

- USGS is useful for discovery, terrain, imagery, and historical comparison.
- It is not the right first source for a simple glacier mass-balance summary.
- Any future use should be server-side and <ENV_VAR>-backed.

### Recommended MVP Implementation Path

Recommended provider path:

1. Use WGMS FoG as the primary MVP source.
2. Do not download or parse the full WGMS dataset in Flutter web.
3. Add a provider-build/proxy phase that runs outside the client:
   - option A: static curated build step that downloads/parses WGMS FoG and
     emits a small checked or hosted summary artifact;
   - option B: Firebase callable `getGlacierSummary` with cache-first behavior.
4. Return only:
   - provider
   - source data id / DOI
   - monitored region count
   - mass-balance signal
   - observation period
   - provider freshness
   - attribution
   - provider health/freshness/cache status
   - safe warnings
5. Add tests from captured, redacted, non-<ENV_VAR> WGMS sample rows before merging
   any production runtime behavior.

Firebase proxy requirement:

- Required if runtime fetching/parsing is needed.
- Not required if a static curated artifact is generated offline and shipped or
  hosted safely.
- Direct Flutter web access is not recommended for full WGMS data.

### Merge Recommendation For `spike/glacier-summary-mvp`

Keep `spike/glacier-summary-mvp` open.

Do not merge it to `main` yet because it still contains fixture-backed behavior,
not provider-validated production data.

The branch is useful as a UI/model reference. Merge only after a follow-up phase
replaces the synthetic fixture with one of:

- a static curated WGMS summary artifact, or
- a Firebase callable/proxy response backed by cached WGMS summary parsing.

Recommended next phase:

```text
P9.26 WGMS Summary Parser/Proxy Design
```

Goal:

- Decide static build artifact vs Firebase callable.
- Acquire a small WGMS sample outside Flutter web.
- Prove the mass-balance summary calculation.
- Preserve P9.23's summary-only client model.

## P9.26 WGMS Summary Parser / Proxy Design

Design date: 2026-06-01

Design branch/workspace:

```text
<LOCAL_WORKSPACE_PATH>
spike/glacier-provider-validation
```

Parser prototype:

```text
<LOCAL_WORKSPACE_PATH>
```

### Design Decision

Preferred MVP approach:

1. **Static generated JSON summary artifact** for first production integration.
2. Generate it outside Flutter web with root tooling.
3. Commit or host only the compact summary JSON artifact in a future approved app
   phase.
4. Do not commit raw WGMS CSV/ZIP data.
5. Do not add Firebase callable runtime fetching for MVP unless the static
   artifact process proves operationally inadequate.

Rationale:

- WGMS FoG data is slow-moving and versioned by dataset release, not real-time.
- P9.25 validated official metadata and download headers without <ENV_VAR>.
- The full WGMS dataset is large/raw and unsuitable for direct Flutter web.
- A static summary artifact is reviewable, cache-free for the client, easy to
  roll back, and avoids introducing Firebase/runtime provider complexity before
  the parsing method is proven against real rows.
- Firebase callable remains the Phase 2 option for server-side refresh,
  authenticated access boundaries, or scheduled cache refresh.

Rejected for MVP:

- Direct Flutter web download/parsing of WGMS CSV/ZIP.
- Direct WFS integration, because official WFS links returned `404` in local
  validation and need provider confirmation.
- Firebase callable as the first step, because no <ENV_VAR>/auth need is proven and
  the parser schema is not yet proven against real rows.
- Fixture-only UI merge, because fixture behavior does not represent provider
  data.

### Strategy Options

#### Static Build-Step Generation

Recommended MVP path.

process:

1. Operator downloads the approved WGMS FoG CSV/ZIP outside Flutter web.
2. Root tooling parses one approved local CSV/ZIP.
3. Tool emits compact summary JSON.
4. Future app phase reviews and commits/hosts only summary JSON.
5. Flutter app reads summary JSON without provider credentials or raw rows.

Benefits:

- No provider <ENV_VAR>.
- No Firebase Functions.
- No runtime provider failures.
- Summary payload can be code-reviewed.
- Best match for slow-moving annual/static glacier data.

Risks:

- Manual refresh process until automation is approved.
- Freshness depends on release monitoring.
- Requires a reproducible parser and captured schema tests.

#### Firebase Callable Proxy

Phase 2 option.

process:

1. `getGlacierSummary` callable downloads or reads cached WGMS source data.
2. Callable parses/cache-reduces raw data server-side.
3. Client receives only summary JSON.
4. Callable exposes provider health, cache status, and safe failures.

Benefits:

- Server-side cache/freshness control.
- No raw provider payload reaches Flutter web.
- Can later support scheduled refresh and auth boundaries.

Risks:

- More infrastructure surface.
- Needs callable tests, cache policy, failure taxonomy, and deployment.
- Not justified until parser/schema is stable.

#### Manual Fixture Refresh

Accepted only as a development bridge.

process:

1. Developer updates a local fixture from reviewed WGMS summary output.
2. UI/model tests use the fixture.
3. Fixture remains labeled preview/development-only.

Benefits:

- Fastest way to test UI/model shape.

Risks:

- Not production data.
- Easy to confuse with validated provider data.
- Must not be merged as production behavior without provider-backed summary
  artifact.

### Parser Requirements

Input source:

- Local WGMS CSV or ZIP only.
- No network download inside parser.
- No <ENV_VAR>.
- No provider <ENV_VAR>.
- No app wiring.

Expected input formats:

- `.csv`
- `.zip` containing one approved `.csv`

Prototype ZIP behavior:

- Reads the first ZIP entry matching `*mass*balance*.csv` by default.
- Allows an override entry pattern for future WGMS schema discovery.
- Does not extract files to disk.

Required logical fields:

- region or country:
  - `REGION`
  - `POLITICAL_UNIT`
  - `COUNTRY`
  - `GLACIER_REGION_CODE`
  - `MOUNTAIN_RANGE`
- glacier identifier/name:
  - `GLACIER_NAME`
  - `NAME`
  - `WGMS_ID`
  - `GLIMS_ID`
- observation year:
  - `REFERENCE_YEAR`
  - `SURVEY_YEAR`
  - `YEAR`
  - `YEAR_BALANCE`
  - `BALANCE_YEAR`
- mass-balance value:
  - `ANNUAL_BALANCE`
  - `SPECIFIC_MASS_BALANCE`
  - `MASS_BALANCE`
  - `BA`
  - `B_A`
  - `ANNUAL_BALANCE_MM_W_E`

Output fields:

```json
{
  "provider": "WGMS",
  "sourceDataId": "wgms-fog-2026-02-10",
  "selectedDataset": {
    "title": "Fluctuations of Glaciers (FoG) Database",
    "doi": "https://doi.org/10.5904/wgms-fog-2026-02-10",
    "publicationYear": "2026",
    "releaseDate": "2026-02-10"
  },
  "monitoredRegionCount": 3,
  "monitoredGlacierCount": 3,
  "observationRowCount": 6,
  "numericMassBalanceRowCount": 6,
  "massBalanceSignal": "negative",
  "averageMassBalance": -531.67,
  "observationPeriod": "2022-2023",
  "providerFreshness": "Dataset release 2026-02-10",
  "sourceAttribution": "WGMS (2026): Fluctuations of Glaciers (FoG) Database. World Glacier Monitoring Service (WGMS), Zurich, Switzerland. https://doi.org/10.5904/wgms-fog-2026-02-10",
  "providerStatus": {
    "health": "healthy",
    "freshness": "cached",
    "cacheStatus": "hit",
    "providerFetchStatus": "local-file"
  },
  "warnings": [
    "Parser prototype only.",
    "Validate against real WGMS FoG schema before production use.",
    "Do not expose raw WGMS rows or large source datasets to Flutter web."
  ]
}
```

Error handling:

- Missing input path: fail with clear message unless using embedded sample.
- Missing file: fail with clear message.
- Unsupported extension: fail; only `.csv` and `.zip` are allowed.
- ZIP without matching CSV: fail with clear message.
- Empty CSV: fail with clear message.
- No numeric mass-balance values: fail with clear message.
- Malformed rows: skip only when required field aliases are absent; do not emit
  false precision.

Mass-balance signal thresholds:

- average <= `-250`: `negative`
- average >= `250`: `positive`
- otherwise: `mixed / near neutral`

Thresholds are prototype values. Production thresholds must be reviewed against
WGMS methodology before app integration.

### Parser Prototype Validation

Command:

```powershell
powershell -ExecutionPolicy Bypass -File <LOCAL_WORKSPACE_PATH> -UseEmbeddedSample
```

Result:

- passed
- no network
- no file writes
- no raw dataset
- emitted compact summary JSON

Embedded sample output characteristics:

- monitored region count: `3`
- monitored glacier count: `3`
- observation rows: `6`
- numeric mass-balance rows: `6`
- observation period: `2022-2023`
- mass-balance signal: `negative`
- average mass balance: `-531.67`
- provider freshness: `Dataset release 2026-02-10`
- attribution: WGMS 2026 FoG citation with DOI

### Freshness Model

MVP freshness should be dataset-version based, not realtime:

- `providerFreshness`: dataset release date
- `sourceDataId`: WGMS DOI slug/version
- `providerStatus.freshness`: `cached`
- `providerStatus.cacheStatus`: `hit`
- optional future field: generated summary timestamp

Do not imply live glacier monitoring.

### Production Readiness Gates

Before production app integration:

1. Download WGMS FoG source outside Flutter web.
2. Identify the exact CSV file(s) containing annual/specific mass-balance rows.
3. Run parser against a small real extracted sample.
4. Capture a redacted/non-<ENV_VAR> sample fixture.
5. Add parser tests for real column names.
6. Review mass-balance signal thresholds against WGMS methodology.
7. Decide whether generated summary JSON is committed as an asset or hosted.
8. Only then replace the `spike/glacier-summary-mvp` synthetic fixture.

### Merge Recommendation For `spike/glacier-summary-mvp`

Keep `spike/glacier-summary-mvp` open.

Do not merge until a real WGMS-derived summary artifact or callable response
replaces the embedded/synthetic fixture.

Once a real generated summary artifact exists, the spike branch can be used as
the model/UI merge reference because its summary model and observability shape
match the recommended payload.

Recommended next phase:

```text
P9.27 WGMS Real Sample Extraction
```

Goal:

- Acquire the approved WGMS FoG dataset outside Flutter web.
- Identify the exact mass-balance CSV schema.
- Run `build-wgms-glacier-summary.ps1` against a small real sample.
- Capture redacted fixture rows and expected output.
- Decide summary asset vs hosted summary artifact.

## P9.27 WGMS Real Sample Extraction

Validation date: 2026-06-01

Validation branch/workspace:

```text
<LOCAL_WORKSPACE_PATH>
spike/glacier-provider-validation
```

Raw dataset source:

```text
https://wgms.ch/downloads/DOI-WGMS-FoG-2026-02-10.zip
```

Temporary local path used:

```text
D:\XYZ\Temp\wgms-glacier-sample\DOI-WGMS-FoG-2026-02-10.zip
```

The raw WGMS ZIP was kept outside the app repo and must not be committed.

Compact preview artifact:

```text
<LOCAL_WORKSPACE_PATH>
```

The preview artifact is approximately 2 KB and contains summary-only data. It
does not contain raw WGMS rows, coordinates, map geometry, imagery, gridded data,
provider <ENV_VAR>, or app wiring.

### Real Dataset Contents Audited

The WGMS ZIP contains these CSV entries:

- `data/agency.csv`
- `data/change.csv`
- `data/change_band.csv`
- `data/event.csv`
- `data/front_variation.csv`
- `data/glacier.csv`
- `data/mass_balance.csv`
- `data/mass_balance_band.csv`
- `data/mass_balance_point.csv`
- `data/person.csv`
- `data/state.csv`
- `data/state_band.csv`

The MVP parser used:

```text
data/mass_balance.csv
```

Reason:

- It is the smallest direct mass-balance table suitable for summary extraction.
- It contains annual balance values, glacier names/ids, country/region proxy,
  years, blank values, and multi-year coverage.
- It avoids larger raw change tables and map/geometry-style processes.

### Actual Column Mapping

Observed real header:

```text
country,glacier_name,glacier_id,outline_id,year,time_system,begin_date,begin_date_unc,midseason_date,midseason_date_unc,end_date,end_date_unc,winter_balance,winter_balance_unc,summer_balance,summer_balance_unc,annual_balance,annual_balance_unc,ela_position,ela,ela_unc,aar,area,investigators,agencies,references,remarks
```

Accepted parser mappings:

- region/country:
  - actual: `country`
  - parser alias: `COUNTRY`
- glacier identifier/name:
  - actual: `glacier_name`
  - parser alias: `GLACIER_NAME`
  - actual: `glacier_id`
  - future alias recommended: `GLACIER_ID`
- observation year:
  - actual: `year`
  - parser alias: `YEAR`
- mass-balance value:
  - actual: `annual_balance`
  - parser alias: `ANNUAL_BALANCE`

PowerShell property lookup was case-insensitive, so existing uppercase aliases
matched real lowercase columns. Future parser hardening should explicitly include
the lowercase names for readability and test clarity.

### Parser Changes From Real Sample

The real WGMS sample showed annual balance values are meter water equivalent
style values rather than millimeter-scale values. The prototype threshold was
updated from `+/-250` to:

```text
+/-0.25
```

The parser now emits:

- `blankMassBalanceRowCount`
- `negativeMassBalanceRowCount`
- `positiveMassBalanceRowCount`
- `neutralMassBalanceRowCount`
- `massBalanceUnit`
- `massBalanceSignalThreshold`
- optional `-OutputPath` support

These additions make null/blank handling and positive/negative/neutral
distribution visible without exposing raw rows.

### Validation Commands

Embedded sample validation:

```powershell
powershell -ExecutionPolicy Bypass -File <LOCAL_WORKSPACE_PATH> -UseEmbeddedSample
```

Real sample validation:

```powershell
$zip = 'D:\XYZ\Temp\wgms-glacier-sample\DOI-WGMS-FoG-2026-02-10.zip'
powershell -ExecutionPolicy Bypass -File <LOCAL_WORKSPACE_PATH> -InputPath $zip -ZipEntryPattern 'data/mass_balance.csv' -OutputPath <LOCAL_WORKSPACE_PATH>
```

Both validations passed.

### Real Summary Output Shape

Real sample output characteristics:

- provider: `WGMS`
- sourceDataId: `wgms-fog-2026-02-10`
- monitoredRegionCount: `38`
- monitoredGlacierCount: `551`
- observationRowCount: `8944`
- numericMassBalanceRowCount: `8444`
- blankMassBalanceRowCount: `500`
- negativeMassBalanceRowCount: `5262`
- positiveMassBalanceRowCount: `1218`
- neutralMassBalanceRowCount: `1964`
- massBalanceSignal: `negative`
- averageMassBalance: `-0.57`
- massBalanceUnit: `m w.e. (as reported by WGMS annual_balance sample)`
- massBalanceSignalThreshold: `+/-0.25`
- observationPeriod: `1885-2026`
- providerFreshness: `Dataset release 2026-02-10`

Compact payload:

```json
{
  "provider": "WGMS",
  "sourceDataId": "wgms-fog-2026-02-10",
  "monitoredRegionCount": 38,
  "monitoredGlacierCount": 551,
  "observationRowCount": 8944,
  "numericMassBalanceRowCount": 8444,
  "blankMassBalanceRowCount": 500,
  "negativeMassBalanceRowCount": 5262,
  "positiveMassBalanceRowCount": 1218,
  "neutralMassBalanceRowCount": 1964,
  "massBalanceSignal": "negative",
  "averageMassBalance": -0.57,
  "massBalanceUnit": "m w.e. (as reported by WGMS annual_balance sample)",
  "massBalanceSignalThreshold": "+/-0.25",
  "observationPeriod": "1885-2026",
  "providerFreshness": "Dataset release 2026-02-10"
}
```

### Artifact Recommendation

Recommended first production artifact location:

- app asset, if the summary is manually generated and version-controlled as a
  small reviewed JSON file;
- remote static hosting, if the summary should refresh without app releases;
- Firebase callable, only if refresh orchestration, access control, or server
  cache observability is required.

Recommended next step:

- Use the generated summary JSON as a tooling-only fixture until an app phase
  explicitly approves adding it to `apps/rand0m` assets.

Do not wire `wgms-glacier-summary-preview.json` into the app during P9.27.

### Production Readiness Gaps

Still required before app integration:

1. Review the `+/-0.25` mass-balance threshold with WGMS methodology.
2. Decide whether country count is sufficient for `monitoredRegionCount` or if a
   different regional grouping should be derived from WGMS metadata.
3. Decide whether `glacier_id` should be counted instead of `glacier_name`.
4. Add automated parser tests with a tiny redacted real-schema CSV fixture.
5. Decide whether preview artifact timestamps should be deterministic for
   version control.
6. Decide app asset vs remote static hosting vs Firebase callable.
7. Replace synthetic fixture behavior in `spike/glacier-summary-mvp` only after
   the artifact location is approved.

### Merge Recommendation For `spike/glacier-summary-mvp`

Keep `spike/glacier-summary-mvp` open.

Do not merge it yet. The branch model/UI remains useful, and the real summary
shape now closely matches it, but the app still needs an approved artifact
location and deterministic fixture/test strategy.

Recommended next phase:

```text
P9.28 Glacier Summary Asset Integration Plan
```

Goal:

- Decide app asset vs static hosting vs callable.
- Add tiny redacted parser fixture tests.
- Make summary artifact generation deterministic.
- Plan replacement of the synthetic glacier UI fixture with the real compact
  WGMS summary artifact.

## P9.28 Glacier Summary Asset Integration Plan

Planning date: 2026-06-01

Scope: planning/design only. This section does not authorize Flutter app wiring,
Firebase Functions, deployment, or merging `spike/glacier-summary-mvp`.

### Asset Strategy Decision

Preferred production MVP strategy:

```text
Committed app asset containing compact WGMS-derived summary JSON.
```

Recommended app asset path:

```text
<LOCAL_WORKSPACE_PATH>
```

Recommended asset declaration:

```yaml
flutter:
  assets:
    - assets/earth/glaciers/wgms-glacier-summary.json
```

Commit recommendation:

- Commit the compact generated summary JSON in `apps/rand0m`.
- Do not commit raw WGMS CSV/ZIP data.
- Do not commit extracted WGMS rows.
- Do not commit large intermediate data files.

Why committed asset first:

- Small and reviewable: current summary artifact is about 2 KB.
- No runtime network dependency.
- No Firebase Functions required.
- No provider <ENV_VAR>.
- No user data.
- Predictable rollback.
- Best fit for slow-moving, dataset-release-based glacier data.

Deferred alternatives:

- Remote static hosting: use only if summary refresh must happen without app
  releases.
- Firebase callable: use only if server-side refresh, auth, cache
  observability, or provider orchestration becomes necessary.
- Tooling-only fixture: acceptable for tests, but not enough for production UI.

### Generation Command

Current real-data generation command:

```powershell
$zip = 'D:\XYZ\Temp\wgms-glacier-sample\DOI-WGMS-FoG-2026-02-10.zip'
powershell -ExecutionPolicy Bypass -File <LOCAL_WORKSPACE_PATH> -InputPath $zip -ZipEntryPattern 'data/mass_balance.csv' -OutputPath <LOCAL_WORKSPACE_PATH>
```

Future asset generation command should write directly to the app asset path only
after an app integration phase is approved:

```powershell
$zip = '<local path outside repo>\DOI-WGMS-FoG-2026-02-10.zip'
powershell -ExecutionPolicy Bypass -File <LOCAL_WORKSPACE_PATH> -InputPath $zip -ZipEntryPattern 'data/mass_balance.csv' -OutputPath <LOCAL_WORKSPACE_PATH>
```

Raw dataset location rule:

- Raw WGMS ZIP/CSV must stay outside `<LOCAL_WORKSPACE_PATH>`.
- Preferred temporary path pattern:

```text
%TEMP%\wgms-glacier-sample\DOI-WGMS-FoG-2026-02-10.zip
```

### Refresh Cadence

Recommended MVP refresh cadence:

- Manual refresh when WGMS publishes a new FoG database release.
- Check WGMS release metadata quarterly or before Earth feature releases.
- Do not imply realtime/live glacier monitoring.

Display freshness as:

```text
Dataset release 2026-02-10
```

Display source version as:

```text
wgms-fog-2026-02-10
```

### Attribution Display

Required visible attribution:

```text
WGMS (2026): Fluctuations of Glaciers (FoG) Database. World Glacier Monitoring Service (WGMS), Zurich, Switzerland. https://doi.org/10.5904/wgms-fog-2026-02-10
```

UI should surface attribution near:

- Glaciers summary card details.
- Learn More / methodology section.
- Source details section if compact card space is limited.

Do not hide attribution behind source metadata alone.

### Deterministic Generation Requirements

Before app integration, update parser/tooling so generated app asset JSON is
deterministic:

- Stable key ordering if practical.
- No volatile `lastSuccessfulRetrievalAtUtc` in committed asset output, or move
  it to a deterministic `generatedFromDatasetRelease`/`summaryGeneratedAt`
  field intentionally set by the release operator.
- Stable newline/encoding.
- Repeat generation from the same WGMS ZIP should produce no git diff unless
  parser logic changes.

Required parser tests:

- Embedded sample validation remains.
- Tiny redacted real-schema CSV fixture:
  - lowercase `country`
  - lowercase `glacier_name`
  - lowercase `glacier_id`
  - lowercase `year`
  - lowercase `annual_balance`
  - blank/null annual balance rows
  - negative values
  - positive values
  - neutral values
  - multiple countries
  - multiple years
- Expected output snapshot for that fixture.
- Missing mass-balance column failure.
- Empty CSV failure.
- Unsupported extension failure.

Fixture location recommendation:

```text
<LOCAL_WORKSPACE_PATH>
<LOCAL_WORKSPACE_PATH>
```

Fixture rule:

- Keep fixtures tiny and redacted.
- Do not include raw large WGMS tables.

### App Integration Requirements

Future app phase must:

1. Add app asset JSON at:

```text
apps/rand0m/assets/earth/glaciers/wgms-glacier-summary.json
```

2. Declare the asset in `apps/rand0m/pubspec.yaml`.
3. Load asset JSON locally using Flutter asset loading.
4. Map asset JSON into `EarthGlacierSummary`.
5. Preserve `EarthGlacierSummary` schema validation.
6. Preserve provider health/freshness UI.
7. Preserve safe error state when:
   - asset is missing;
   - JSON is malformed;
   - required attribution is missing;
   - source metadata is missing.
8. Label the UI as:

```text
WGMS-derived summary
Not live
Dataset release 2026-02-10
```

9. Display attribution and methodology.
10. Add no network calls.
11. Add no Firebase Functions.
12. Add no map rendering, overlays, coordinates, imagery, or raw rows.

Recommended service behavior:

- Reuse the `EarthGlacierSummaryService` seam from `spike/glacier-summary-mvp`.
- Replace fixture-backed implementation with asset-backed implementation.
- Keep fixture-backed service only for tests/development if useful.

Fallback behavior:

- If asset load fails, show the existing Glaciers readiness content and a safe
  unavailable provider status.
- User-facing copy:

```text
Glacier summary asset is temporarily unavailable.
```

- Do not crash the Earth tab.
- Do not retry network.
- Do not silently fall back to synthetic production values.

### Reusable Work From `spike/glacier-summary-mvp`

Reusable:

- `EarthGlacierSummary` model shape.
- `EarthGlacierSummarySchemaException`.
- Summary service seam.
- Glaciers card loader injection.
- Provider health/freshness panel reuse.
- Preview/failure UI structure.
- Tests for:
  - model parsing;
  - empty state;
  - malformed source data;
  - attribution requirement;
  - provider health/freshness parsing;
  - card success/failure rendering.

Must change before merge:

- Replace synthetic fixture with asset-backed WGMS summary.
- Change UI labels from:

```text
provider spike
not production
```

to:

```text
WGMS-derived summary
not live
```

- Add app asset tests.
- Add parser fixture/snapshot tests.
- Ensure no production UI reads tooling output directly.

### Production Gates

Do not merge app integration until all gates pass:

1. Parser emits deterministic summary JSON.
2. Tiny real-schema parser fixture tests pass.
3. App asset exists and is declared.
4. Asset JSON parses into `EarthGlacierSummary`.
5. UI shows WGMS-derived/not-live labels.
6. UI shows attribution and dataset release freshness.
7. Missing/malformed asset tests pass.
8. Existing Weather, Wind, Wildfires, Carbon, Tree-Time, Ocean, Flights, Ships,
   and Terrain behavior remains unchanged.
9. Full app validation passes:
   - `flutter analyze`
   - `flutter test`
   - `flutter build web`
   - `validate-all.ps1`

### Merge Strategy

Recommended branch plan:

1. Keep `spike/glacier-summary-mvp` open.
2. Create production branch from `main`:

```text
feature/glacier-summary-asset-mvp
```

3. Cherry-pick or manually port only reusable model/service/UI/test pieces from
   `spike/glacier-summary-mvp`.
4. Add deterministic parser fixture tests in root tooling.
5. Generate and commit compact app asset JSON.
6. Replace synthetic fixture behavior with asset-backed behavior.
7. Run full validation.
8. Deploy only after merge to `main` and normal full-cycle rules apply.

Do not merge the spike branch directly unless it has been rebased/reviewed and
all synthetic fixture behavior has been removed.

### Rollback Strategy

Rollback should be simple:

- Remove asset-backed loader wiring.
- Restore readiness-only Glaciers card behavior.
- Keep source registry metadata.
- Keep parser tooling and QA contract history.
- Remove app asset declaration only if no other app code uses it.

Expected user-visible fallback:

```text
Glaciers readiness remains visible with Not Yet Connected/unavailable summary state.
```

No Firestore, Firebase Function, provider credential, or package rollback should
be required for the asset MVP.

### Recommended Next Phase

```text
P9.29 Glacier Summary Asset MVP
```

Scope:

- app runtime integration on a production feature branch;
- deterministic parser fixture tests;
- compact app asset JSON;
- asset-backed glacier summary service;
- no network calls;
- no Firebase Functions;
- no raw WGMS data committed.
