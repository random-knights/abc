# P9.7 NASA FIRMS Integration Contract

Date: 2026-05-31

Scope: architecture contract only. This document does not authorize NASA calls, API implementation, Firebase Functions, Firestore writes, provider integrations, Earth rendering, map SDKs, runtime behavior changes, validation, or deploy.

Documentation boundary: `<LOCAL_WORKSPACE_PATH>` remains source-only. This contract belongs directly in `<LOCAL_WORKSPACE_PATH>`.

## Source Guidance Read

- `<LOCAL_WORKSPACE_PATH>`
- `<LOCAL_WORKSPACE_PATH>`
- `<LOCAL_WORKSPACE_PATH>`

## Official FIRMS References Checked

- NASA FIRMS API index: https://firms.modaps.eosdis.nasa.gov/api/
- NASA FIRMS API tutorial / MAP_KEY usage: https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html
- NASA FIRMS data availability endpoint: https://firms.modaps.eosdis.nasa.gov/api/data_availability/
- NASA Earthdata FIRMS wiki: https://wiki.earthdata.nasa.gov/spaces/FIRMS/pages/32079892/Fire+Information+for+Resource+Management+System+FIRMS
- NASA Applied Sciences fires page: https://appliedsciences.nasa.gov/what-we-do/disasters/fires
- NASA Earthdata FIRMS confidence FAQ forum entry: https://forum.earthdata.nasa.gov/viewtopic.php?t=5182
- NASA FIRMS one-pager PDF: https://www.earthdata.nasa.gov/s3fs-public/2023-03/FIRMS_OnePager_2022_Prnt-Web.pdf

## Current Runtime Audit

### Existing Earth Wildfire Layer

Current implementation is app-local in `apps/rand0m`:

- `lib/models/connect/earth_wildfire.dart`
- `lib/pages/connect.dart`
- `lib/services/connect/earth_source_registry.dart`

Current behavior:

- `/c0nnect` contains Connect and Earth tabs.
- Earth tab is read-only.
- Wildfires has a static readiness card.
- Wildfire metrics are placeholders: `Not Yet Connected`.
- No NASA request exists.
- No Firebase Function exists.
- No map rendering exists.
- No command execution changes exist.

Current Wildfire readiness card displays:

- Provider: NASA FIRMS
- Source Type: Earth Observation
- Status: research
- Future Phase: P9.7
- Educational detection and monitoring copy
- Methodology copy stating readiness only

### Existing Earth Source Registry

`EarthSourceRegistry` already maps the Wildfires layer to a NASA FIRMS source:

```text
sourceId: nasa-firms
layerId: wildfires
category: earth
provider: NASA FIRMS
authType: apiKey
futureFunctionRequired: true
futureApiRequired: true
status: research
sourceType: Earth Observation
refreshPolicy: Future thermal anomaly refresh measured in hours.
cachePolicy: Future wildfire cache with acquisition timestamp labels.
```

This is the correct registry posture for P9.7. It communicates source intent without enabling network access.

### Existing Weather MVP

Earth Weather uses existing app weather infrastructure:

- `EarthWeatherService.fetchCurrent`
- `LocationService`
- `WeatherService.fetchCurrent`
- `<ENV_VAR>`

Weather currently calls a provider directly from app code. That approach should not be copied for FIRMS because FIRMS requires a MAP_KEY, likely needs request shaping and transaction protection, and can return very large CSV payloads.

### Existing PageSpeed Firebase Proxy Pattern

`apps/rand0m/functions/src/index.ts` contains `runPageSpeedAudit`:

- callable Function
- `assertRand0mUser(request)` auth boundary
- strict input validation
- server-side API key lookup
- bounded provider request
- timeout
- safe logging context
- provider failure mapping through callable error semantics

This is the preferred precedent for FIRMS if runtime integration is approved.

### Existing Auth Boundaries

Current app and Functions rules require verified Rand0m users. Callable Functions preserve safe error semantics:

- `unauthenticated`
- `permission-denied`
- `invalid-argument`
- `internal`
- `unavailable`

FIRMS integration must use the same auth semantics and must not expose MAP_KEY values to the browser.

### Existing Connect Source Architecture

Connect source metadata separates source catalog, source status, and future connection/access behavior. The FIRMS layer should continue to use source metadata for display and future capability checks. Source-backed commands should remain governed by P8 command policy.

### Existing Earth Source Metadata Model

The current model is sufficient for readiness:

```text
EarthSourceMetadata
- sourceId
- layerId
- category
- provider
- authType
- refreshPolicy
- cachePolicy
- futureFunctionRequired
- futureApiRequired
- status
- sourceType
```

P9.8 should add runtime-specific metadata only if needed, preferably app-local:

```text
EarthWildfireSourceContract
- sourceId
- endpointKind
- dataId
- areaScope
- dayRange
- maxRows
- cacheTtl
- staleAfter
- requiresProxy
```

## FIRMS Data Sources

NASA FIRMS provides fire and thermal anomaly data from several source families. For Rand0m Earth Wildfire MVP, do not start with all of them.

Recommended MVP sources:

- `VIIRS_NOAA20_NRT`
- optionally `VIIRS_SNPP_NRT` after the first path is stable

Candidate later sources:

- `VIIRS_NOAA21_NRT`
- `MODIS_NRT`
- `LANDSAT_NRT` for US/Canada or specialized higher-resolution contexts
- geostationary active fire products for higher temporal frequency but more caveats
- standard processing (`*_SP`) for historical/validated views, not live MVP

Reasoning:

- FIRMS active fire locations are processed using MODIS and VIIRS fire/thermal anomaly algorithms.
- FIRMS distributes near real-time MODIS/VIIRS active fire data, commonly described as available within about 3 hours of satellite observation.
- VIIRS has 375m active fire detections in NASA FIRMS materials; MODIS is coarser at about 1km.
- NASA FIRMS API data availability returns dataset ids and date ranges, so runtime integration should not hardcode availability without checking.

## API / Feed Evaluation

### FIRMS API

Relevant endpoints:

- API index: `/api/`
- data availability: `/api/data_availability/csv/{MAP_KEY}/all`
- area CSV: `/api/area/csv/{MAP_KEY}/{SOURCE}/{AREA_COORDINATES}/{DAY_RANGE}`
- optional historical date in area endpoint
- map key status: `/mapserver/mapkey_status/?MAP_KEY={MAP_KEY}`

Important constraints:

- FIRMS web services require a free MAP_KEY.
- MAP_KEY exists to conserve FIRMS resources.
- The key uses transaction limits in a 10-minute window.
- NASA examples show 5,000 transactions per 10-minute interval, but large requests can count as multiple transactions.
- Entire-world VIIRS requests can return tens of thousands to more than 100,000 records per day.
- API area responses are CSV at this time; NASA Q&A indicates JSON/pagination is not currently available for Area API.

### FIRMS Data Feeds

FIRMS also provides downloadable active fire data in GIS-oriented formats and daily text files/feeds. These are useful for future bulk/offline flows, but they are not the recommended MVP path for an interactive web card.

Recommended use:

- MVP: bounded Area API through Firebase proxy.
- Phase 2: consider region feeds or scheduled cache warmers if daily/bulk regional views become necessary.
- Long term: consider archive/download flows for historical analysis, not browser interaction.

### Update Frequency

Use source-specific freshness labels rather than promising exact real-time behavior.

Contract language:

- FIRMS is near real-time, not emergency-grade real-time.
- Global MODIS/VIIRS active fire data should be labeled as satellite-observation based and commonly available within about 3 hours.
- Geostationary products may have higher temporal frequency but should be treated as later-phase and explicitly labeled provisional/beta where NASA labels them that way.

### Licensing / Usage Considerations

- NASA Earth science data is generally open, but source pages and product docs must be consulted for each dataset/product.
- FIRMS service use must respect MAP_KEY transaction limits and resource guidance.
- NASA/FIRMS attribution should be visible wherever Wildfire data is shown.
- Do not imply emergency alerting, evacuation guidance, or incident-command reliability.
- User-facing copy must say satellite detections may include false positives/false negatives and can be affected by clouds, sensor coverage, overpass timing, and confidence semantics.

## Recommended Access Method

Use a Firebase callable proxy for any live FIRMS MVP.

Do not call FIRMS directly from Flutter web.

Rationale:

- MAP_KEY must not be exposed to browser code.
- Requests must be bounded before reaching NASA.
- CSV parsing should happen server-side.
- Cache and rate-limit controls belong server-side.
- Provider errors should be normalized to Rand0m callable error semantics.
- Existing PageSpeed proxy already establishes this pattern.

Recommended future callable name:

```text
getEarthWildfireSummary
```

Alternative lower-level name:

```text
runFirmsWildfireSummary
```

Preferred response shape is summary-first, not raw-payload-first.

## Browser vs Firebase Proxy Recommendation

### Browser Direct Access

Not recommended.

Risks:

- Exposes MAP_KEY.
- Harder to rate-limit or cache across users.
- CSV parsing and large payload handling happen in the client.
- Browser cannot safely normalize upstream failures.
- Direct calls create more places for accidental over-querying.

### Firebase Proxy

Recommended.

Rules:

- Callable only.
- Require authenticated Rand0m user.
- Server-side MAP_KEY only.
- Bounding-box and day-range allowlist.
- Small response summaries.
- No raw FIRMS payload returned by default.
- Safe error mapping.
- Cache before calling FIRMS.

## Caching Strategy

### MVP Cache

Use server-side cache for query summaries.

Cache key:

```text
sourceId + dataId + normalizedAreaIdOrBounds + dayRange + date
```

Recommended MVP cache TTL:

- 30 minutes for NRT regional summaries.
- 60 minutes for global coarse summaries.
- 24 hours for data availability metadata.
- 10 minutes for MAP_KEY status if surfaced internally only.

Cache storage options:

1. In-memory per Function instance for first MVP.
   - Low complexity.
   - Not durable across cold starts.
   - Acceptable if query volume is tiny.

2. Firestore or Cloud Storage cache for Phase 2.
   - Requires explicit approval because this phase forbids Firestore writes.
   - Better for cross-instance reuse and quota protection.

MVP recommendation:

- Start with in-memory cache in the callable Function.
- Add explicit TODO for Firestore/Cloud Storage cache only after observed need.

### Cache Payload

Store summary, not raw CSV:

```text
EarthWildfireSummaryCacheEntry
- cacheKey
- sourceId
- dataId
- boundsLabel
- dayRange
- generatedAt
- sourceMaxAcquisitionAt
- expiresAt
- activeDetectionCount
- regionSummaries
- confidenceBreakdown
- safeWarnings
```

Do not cache:

- MAP_KEY
- raw request URL with key
- raw CSV unless a future data retention phase approves it
- user identifiers unless required and approved

## Freshness Strategy

Every rendered Wildfire result must display:

- source provider: NASA FIRMS
- dataset id, for example `VIIRS_NOAA20_NRT`
- query window, for example `last 24 hours`
- generated-at timestamp
- latest acquisition timestamp from the returned detections
- cache status: fresh / cached / stale
- freshness warning if the latest acquisition is older than expected

Freshness states:

```text
fresh: cache entry within TTL and detections include recent acquisition times
cached: cache entry within TTL but not necessarily recent detections
stale: cache entry expired or latest acquisition older than threshold
unavailable: no data because provider or proxy failed
```

User-facing warning:

```text
Satellite detections are delayed by sensor coverage and processing time. This layer is not an emergency alert system.
```

## Rate-Limit Strategy

Server-side guardrails:

- Never allow arbitrary world queries from the client in MVP.
- Allow only approved area presets or tightly validated bounding boxes.
- Cap day range to 1 day for MVP.
- Hard cap parsed CSV rows, for example 5,000 rows for regional MVP.
- Check cache before calling FIRMS.
- Optionally check MAP_KEY transaction status before expensive calls.
- Set timeout, for example 12 seconds.
- Fail closed if response is too large.
- Do not retry aggressively. At most one retry for transient network failure, after cache check.

Suggested MVP preset areas:

- `global-summary-lite` should not call full world VIIRS Area API. Use it only when backed by a safer summary/feed approach.
- `north-america-west`
- `us-west`
- `canada-west`
- later: user-selected small bounding box after map work exists.

## Failure Handling

Normalize all failures to safe app states. Do not expose raw NASA/FIRMS errors.

Failure classes:

- `notConfigured`: FIRMS MAP_KEY missing on server.
- `unauthenticated`: user is not signed in / allowed.
- `invalidArea`: requested area is unsupported or too large.
- `rateLimited`: transaction budget low or upstream 429/limit response.
- `providerUnavailable`: FIRMS unavailable, timeout, or outage.
- `parseFailed`: CSV schema unexpected.
- `noDetections`: request succeeded with no active detections.
- `staleData`: cached or returned acquisition times are older than threshold.

Callable mapping:

- `unauthenticated` -> `unauthenticated`
- invalid arguments -> `invalid-argument`
- disallowed user -> `permission-denied`
- provider unavailable/rate limited -> `unavailable`
- parse/internal defects -> `internal`

## User-Facing Error Copy

Use calm, non-technical copy:

- Not configured: `Wildfire data is not connected yet.`
- Unauthenticated: `Sign in with an approved Rand0m account to view wildfire data.`
- Invalid area: `That wildfire area is not available yet.`
- Rate limited: `Wildfire data is busy right now. Try again soon.`
- Provider unavailable: `NASA FIRMS data is temporarily unavailable.`
- Parse failed: `Wildfire data could not be read safely.`
- No detections: `No active detections were found for this area and time window.`
- Stale data: `Showing cached wildfire data. Fresh detections are not available yet.`

Always include the non-emergency disclaimer near result cards:

```text
Educational preview only. Not for emergency response.
```

## Earth Source Status Transitions

Current enum:

- planned
- research
- available
- connected

P9.7 also requires error handling. Add `error` in a future runtime phase only when code changes are approved.

Recommended semantics:

| Status | Meaning | Wildfire usage |
| --- | --- | --- |
| planned | Layer/source exists but no integration design is complete. | Pre-P9.6 state. |
| research | Contract/design exists, no live provider access. | Current P9.6/P9.7 state. |
| available | Runtime code exists and server is configured, but user has not established any source-specific connection if one is required. | After callable exists and MAP_KEY is configured. |
| connected | Source status check succeeds and the app can retrieve bounded summaries. | After first successful status check/query. |
| error | Configuration, provider, parse, or rate-limit failure. | Add when UI can display safe failure state. |

For FIRMS, `connected` should mean server-side access is configured and last bounded summary fetch succeeded. It should not mean OAuth/user grant, because FIRMS MAP_KEY is app infrastructure, not a user OAuth connection.

## Wildfire Model Proposal

### MVP Models

```text
EarthWildfireDetection
- id
- latitude
- longitude
- confidenceLabel
- confidenceRaw
- acquisitionAtUtc
- sourceDataId
- satellite
- instrument
- fireRadiativePower
- dayNight
```

```text
EarthWildfireRegionSummary
- regionId
- label
- activeDetections
- recentDetections
- highConfidenceDetections
- latestAcquisitionAtUtc
- dominantConfidenceLabel
```

```text
EarthWildfireSummary
- provider: NASA FIRMS
- sourceType: Earth Observation
- status
- sourceDataId
- areaLabel
- queryWindowLabel
- generatedAtUtc
- latestAcquisitionAtUtc
- cacheState
- activeDetections
- regions
- confidenceBreakdown
- warnings
- sourceMetadata
```

```text
EarthWildfireSourceMetadata
- endpointKind: area_csv
- sourceDataId
- dayRange
- boundsLabel
- attribution
- freshnessPolicy
- limitations
```

### Fields To Parse From FIRMS CSV

Expected common Area API fields include:

- `latitude`
- `longitude`
- brightness fields such as `bright_ti4` / `bright_ti5` for VIIRS
- `scan`
- `track`
- `acq_date`
- `acq_time`
- `satellite`
- `instrument`
- `confidence`
- `version`
- `frp`
- `daynight`

Parsing rules:

- Treat `acq_date` + `acq_time` as UTC-like source acquisition fields unless NASA docs specify otherwise for a specific product.
- Preserve confidence as source-specific. Do not normalize MODIS numeric and VIIRS low/nominal/high into a fake universal score.
- Keep raw coordinate precision for display/map, but do not log full raw rows unless approved.

## Security Requirements

- Store FIRMS MAP_KEY server-side only.
- Do not add client env vars for FIRMS.
- Use existing Rand0m callable auth boundary.
- Validate all client inputs.
- Allowlist source ids and dataset ids.
- Allowlist area presets for MVP.
- Cap day range.
- Cap response size and parsed row count.
- Use request timeout.
- Map upstream failures to safe callable errors.
- Never return raw provider errors or raw keyed URLs.
- Do not enable App Check enforcement casually; treat App Check as future hardening.

Recommended env key if/when approved:

```text
<ENV_VAR>
```

Do not introduce unscoped names like `NASA_KEY` or `FIRMS_KEY`.

## Privacy Requirements

FIRMS wildfire data is public Earth observation data, but user interaction and location context are privacy-sensitive.

Rules:

- Do not send user identity to FIRMS.
- Do not send precise user location unless a future phase explicitly approves user-location wildfire queries.
- MVP should use preset regions, not current location.
- Logs should include region preset id, not precise ad hoc coordinates.
- If user-selected bounds are added later, round or bucket them before logging.
- Do not store per-user wildfire query history unless approved.

## Logging Requirements

Log only safe operational metadata:

```text
functionName
sourceId
sourceDataId
areaPresetId
dayRange
cacheHit
status
safeErrorCode
rowCountBucket
latestAcquisitionAgeBucket
latencyMs
```

Do not log:

- MAP_KEY
- full request URL
- raw CSV
- precise user location
- provider error body
- user prompt/provider content

Use existing `logFunctionError` style with safe context if implemented in Functions.

## Testing Strategy

### Unit Tests

- CSV parser accepts representative VIIRS/MODIS rows.
- CSV parser rejects missing required columns safely.
- confidence mapping preserves source semantics.
- acquisition timestamp parsing handles zero-padded and non-zero-padded `acq_time`.
- row cap stops large payloads.
- cache key normalization is stable.
- source status transitions map correctly.

### Function Tests

- unauthenticated request fails.
- non-Rand0m user fails.
- invalid area fails.
- unsupported dataset fails.
- day range above cap fails.
- cache hit avoids provider call.
- provider timeout returns safe unavailable copy.
- parse failure returns safe internal/error state.

### Widget Tests

- loading state.
- available summary state.
- no detections state.
- cached/stale warning state.
- safe error copy.
- attribution/disclaimer is visible.

### Integration Tests

Only after explicit approval:

- one small bounded FIRMS query using test/staging MAP_KEY.
- no world query.
- no large day range.
- record only safe metadata.

## Rollback Strategy

Feature flag the live path.

Recommended app-local flag:

```text
EarthWildfireRuntime.enabled
```

Rollback steps:

1. Disable live fetch path.
2. Fall back to P9.6 readiness card.
3. Preserve source registry metadata as `research` or `error` depending on failure.
4. Keep UI educational and read-only.
5. Do not remove tests or models unless a separate cleanup phase approves it.
6. If a Function was deployed, keep callable returning safe unavailable copy until clients no longer call it.

## MVP Wildfire Implementation Recommendation

P9.8 should implement a minimal runtime path only if approved.

MVP sequence:

1. Add runtime model types app-local.
2. Add parser for FIRMS Area API CSV using bundled fixture tests.
3. Add Firebase callable proxy skeleton with auth, allowlists, cache, timeout, and safe errors.
4. Add one small approved area preset.
5. Use `VIIRS_NOAA20_NRT`, day range 1.
6. Return summary metrics only.
7. Update Earth Wildfire card to support loading, available, no detections, stale, and error states.
8. Keep map rendering out of scope.
9. Keep command/agent access out of scope.
10. Validate and deploy only in the implementation phase if required.

MVP UI metrics:

- Active Fire Regions
- Recent Detections
- Global/Regional Fire Activity
- Latest Acquisition
- Confidence Summary
- Freshness

MVP result copy:

```text
NASA FIRMS satellite detections for {area}, {window}. Educational preview only. Not for emergency response.
```

## Phase 2 Wildfire Implementation

- Add multiple area presets.
- Add source availability check using `data_availability`.
- Add Firestore/Cloud Storage cache only after explicit approval.
- Add region aggregation and confidence filters.
- Add stale-data UI.
- Add source status transitions to `available`, `connected`, and `error`.
- Add QUERY preview metadata for Wildfires without enabling source-backed command execution unless separately approved.

## P9.18 Wildfire Source Audit Addendum

Date: 2026-06-01

Runtime audit:

- Current `getWildfireSummary` uses the FIRMS Area API data endpoint:
  `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/{AREA_COORDINATES}/{DAY_RANGE}`.
- It does not rely on a map-only endpoint.
- Current source is `VIIRS_NOAA20_NRT`, day range is enforced as `1`, and requests are limited to approved area presets.
- The callable returns summary data only and does not expose coordinates or raw FIRMS rows to the Flutter UI.

Source candidates reviewed:

| Source | Role | Fit | Notes |
| --- | --- | --- | --- |
| NASA FIRMS Area API | Current active-fire summary source. | Keep as MVP. | Official CSV data endpoint, requires server-side MAP_KEY, needs cache/rate limits. |
| NASA FIRMS data availability | Source/dataset readiness validation. | Add later. | Useful for checking dataset availability before user-facing summary fetches. |
| NOAA Wildland Fire Data Portal | Official NOAA fire-data discovery and early-detection portal. | Research fallback. | Good source-family candidate, but not a direct drop-in replacement for current summary callable. |
| NOAA/NESDIS HMS | Fire and smoke detection context. | Research fallback/augmentation. | Strong smoke/fire context, but product cadence, geometry, and attribution need a separate source contract. |
| Google Earth Engine FIRMS datasets | Analysis and derived raster process. | Long-term only. | Requires Earth Engine auth/project posture and should not be used as a quick client-side fallback. |

Recommendation:

- Keep NASA FIRMS as the only live wildfire provider for now.
- Add no fallback provider in P9.18.
- Treat NOAA Wildland Fire, NOAA/NESDIS HMS, and Earth Engine FIRMS as future source-contract candidates after the FIRMS safe-read path remains stable.
- Future P9.18+ hardening may add a read-only data-availability check through the existing Firebase proxy pattern before broadening wildfire provider coverage.

## Long-Term Wildfire Implementation

- Add map or globe overlay only after Earth rendering architecture is approved.
- Add geostationary data as a separate source with provisional/beta labeling.
- Add historical trend views through archive/download strategy, not interactive Area API overuse.
- Add alert-like UX only if explicitly scoped and with strong disclaimers.
- Add agent-assisted summaries only after source data disclosure, provider routing, and command governance are approved.

## Recommended P9.8 Implementation Command

Recommended next phase title:

```text
P9.8 Earth Wildfire Firebase Proxy Skeleton
```

Recommended implementation command:

```text
Implement P9.8 Earth Wildfire Firebase Proxy Skeleton.

Goal:
Create the first NASA FIRMS runtime foundation without enabling broad wildfire data access or map rendering.

Read first:
- <LOCAL_WORKSPACE_PATH>
- <LOCAL_WORKSPACE_PATH>
- <LOCAL_WORKSPACE_PATH>

Scope:
- Earth Wildfires layer only.
- Firebase callable proxy skeleton only.
- No Firestore writes.
- No map rendering.
- No command execution changes.

Implement:
1. Add app-local FIRMS CSV parser models and tests using fixtures.
2. Add server-side callable design for a bounded wildfire summary.
3. Use server-side MAP_KEY only.
4. Allow only one small approved area preset.
5. Cap day range to 1.
6. Add cache-before-provider-call behavior if feasible without Firestore.
7. Return summary metrics only, not raw CSV.
8. Add safe error states to the Wildfire card.
9. Keep P9.6 readiness fallback.

Do NOT:
- query world-scale FIRMS data
- expose MAP_KEY to Flutter web
- add map SDKs
- add Earth rendering
- add Firestore writes
- add command/agent source execution
- add provider calls outside the proxy

Validation:
Run flutter analyze, flutter test, flutter build web, validate-all.ps1.
Deploy only if explicitly requested by the phase.
```

## Explicit Non-Goals

- No NASA calls in P9.7.
- No API implementation in P9.7.
- No Firebase Functions in P9.7.
- No Firestore writes.
- No providers.
- No Earth rendering.
- No map SDKs.
- No runtime behavior changes.
- No validation.
- No deploy.
