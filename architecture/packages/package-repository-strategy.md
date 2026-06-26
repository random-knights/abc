# Package Repository Strategy

## Status

This document defines the recommended GitHub organization shape for shared
packages before app repo renames and package extraction work begins. It is a
planning artifact only: no repositories were created, no code was moved, no
remotes were changed, and no app repo renames were executed.

Current package location:

```text
<LOCAL_WORKSPACE_PATH>
  rk_branding
  rk_core
  rk_ui
  rk_ai
  rk_agents
  rk_data
  rk_media
```

The requested target org state includes `rk_core`, `rk_ui`, `rk_ai`,
`rk_agents`, `rk_data`, and `rk_media`. The current dependency graph also
contains `rk_branding`, which is required by `rk_ui` and imported directly by
apps. That package must either become its own repo or be intentionally folded
into `rk_ui` before `rk_ui` can be extracted cleanly.

## Final Recommended GitHub Org Structure

Recommended target:

```text
random-knights/
  .github
  rand0m
  knight1y
  out1ine
  up10ad
  rk_core
  rk_branding
  rk_data
  rk_media
  rk_ai
  rk_agents
  rk_ui
  c1assr00m
  e1even
```

If the org must keep the shorter requested list, make this explicit:

- `rk_branding` remains root-workspace-only until `rk_ui` absorbs it, or
- `rk_ui` stops depending on `rk_branding`, or
- `rk_branding` is published as a private/internal dependency without a visible
  standalone GitHub repo.

The cleaner long-term shape is to include `random-knights/rk_branding`.

## Dependency Graph

Current package dependencies:

```text
rk_core      -> none
rk_data      -> none
rk_media     -> none
rk_agents    -> none
rk_branding  -> Flutter, google_fonts
rk_ai        -> rk_core
rk_ui        -> rk_branding, rk_core, rk_data, Flutter, audioplayers
```

Current app dependencies:

```text
rand0m   -> rk_branding, rk_core, rk_ui
out1ine  -> rk_branding, rk_core, rk_ui
up10ad   -> rk_branding, rk_core, rk_ui
knight1y -> rk_agents, rk_ai, rk_branding, rk_core, rk_data, rk_ui
```

Extraction implication:

1. Base packages should be extracted first.
2. Dependent packages should not move until their upstream package repos exist.
3. App `pubspec.yaml` files should not switch from local paths to Git refs until
   all package repos needed by that app are available and tagged.

## Package Readiness Audit

| Package | Public API maturity | Dependencies | App dependencies | Publishability | Repo readiness |
| --- | --- | --- | --- | --- | --- |
| `rk_core` | Strongest. Pure Dart app identity, navigation, environment contracts. Has tests. | none | all apps indirectly/directly | Good candidate for GitHub first; pub.dev possible later. | High |
| `rk_data` | Contract-heavy and pure Dart. No tests yet. Includes favorite/data/audit abstractions. | none | Knight1y and `rk_ui` | GitHub-ready after basic tests. Pub.dev later after API stabilizes. | Medium-high |
| `rk_media` | Small pure Dart scaffold for media contracts. No tests yet. | none | none currently found | GitHub-ready as a scaffold. Pub.dev should wait for real consumers/tests. | Medium |
| `rk_ai` | Mature contracts for providers, models, pricing, impact, runtime key planning. Has tests. | `rk_core` | Knight1y | GitHub-ready after `rk_core`. Pub.dev possible later if provider metadata is stable. | High |
| `rk_agents` | Mature enough for metadata/availability/action contracts. Has tests. | none | Knight1y | GitHub-ready; pub.dev should wait until agent taxonomy is less ecosystem-specific. | High |
| `rk_ui` | Broad and useful, but most volatile. Includes shell, drawer, dashboard, about, weather, oracle, progress, data audit, favorites, response actions. No package tests yet. | `rk_branding`, `rk_core`, `rk_data`, Flutter, audioplayers | all apps | GitHub-ready only after upstream repos exist. Pub.dev later, likely not first wave. | Medium |

### rk_core

Role:

- ecosystem app IDs, app definitions, capabilities, navigation contracts
- environment key-name metadata

Readiness:

- pure Dart
- no runtime/framework dependencies
- test coverage exists
- safest first package extraction

Risks:

- app identity names are ecosystem-specific
- future API churn should be versioned carefully because every package may
  depend on it

Recommendation:

- extract first
- tag `v0.1.0`
- keep GitHub-only initially

### rk_data

Role:

- data records, data sources/providers, audit entries, runtime metrics
- favorite repository/storage/query/statistics contracts
- response interaction contracts

Readiness:

- pure Dart
- no external dependencies
- no direct app imports
- no package tests currently found

Risks:

- favorite/data contracts are actively evolving
- future Hive adapters must stay app-owned or move into a separate adapter
  package

Recommendation:

- extract after `rk_core` or alongside base contract packages
- add minimal tests before publishing tags beyond `v0.1.0`
- keep GitHub-only until persistence contracts settle

### rk_media

Role:

- media asset/type/source/playback contracts
- future render, GIF, audio, and video metadata

Readiness:

- pure Dart
- no external dependencies
- no current app consumers found in import scan

Risks:

- scaffold-only today
- contracts may change once real media/render processes wire in

Recommendation:

- extract early as a low-risk scaffold
- keep GitHub-only
- do not publish to pub.dev until there are consumers and tests

### rk_ai

Role:

- AI provider IDs
- AI model IDs/defaults
- response/usage/pricing/impact contracts
- provider configuration metadata
- runtime environment key planning through `rk_core`

Readiness:

- pure Dart
- depends only on `rk_core`
- test coverage exists
- consumed by Knight1y

Risks:

- provider/model metadata can age quickly
- provider runtime planning must remain value-free and never read <ENV_VAR>

Recommendation:

- extract after `rk_core`
- tag with the same version family as `rk_core`
- keep GitHub-only until provider metadata change policy is defined

### rk_agents

Role:

- agent definitions
- agent actions/tools/execution contracts
- availability and placeholder metadata

Readiness:

- pure Dart
- no package dependencies
- test coverage exists
- consumed by Knight1y

Risks:

- agent catalog is Random Knights-specific
- less suitable for public pub.dev unless split into generic contracts and
  ecosystem definitions later

Recommendation:

- extract early
- keep GitHub-only
- consider future split:
  - `rk_agents`: generic agent contracts
  - `rk_agent_catalog`: Random Knights definitions

### rk_ui

Role:

- shared Flutter UI primitives
- shell/navigation/drawer/dashboard/about
- splash/progress
- weather/oracle presentation
- data audit/favorites/response action widgets

Readiness:

- Flutter package
- depends on `rk_branding`, `rk_core`, and `rk_data`
- broad public API surface
- no package tests currently found

Risks:

- largest blast radius
- depends on omitted `rk_branding`
- app visual expectations may still evolve
- `audioplayers` dependency for splash/progress should remain intentional and
  documented

Recommendation:

- extract after `rk_branding`, `rk_core`, and `rk_data`
- add widget smoke tests before externalizing
- keep GitHub-only for the first repo wave

## Recommended Repo Creation Order

1. `rk_core`
2. `rk_data`
3. `rk_media`
4. `rk_agents`
5. `rk_ai`
6. `rk_branding`
7. `rk_ui`

Why this order:

- `rk_core`, `rk_data`, `rk_media`, and `rk_agents` are pure Dart or isolated
  base packages.
- `rk_ai` depends on `rk_core`, so it should come after `rk_core`.
- `rk_branding` should exist before `rk_ui` because `rk_ui` depends on it.
- `rk_ui` should be last because it depends on multiple packages and has the
  largest app-facing API surface.

If `rk_branding` is not allowed as a standalone repo, stop before extracting
`rk_ui` and decide whether to fold branding into `rk_ui`.

## Versioning Strategy

Initial repo extraction should use `0.x` SemVer:

```text
v0.1.0  first standalone repo tag
v0.2.0  additive public API changes
v0.2.1  fixes/docs/internal changes
v1.0.0  only after app wiring stabilizes and package boundaries are proven
```

Rules:

- tag every package repo before apps consume it by Git URL
- avoid floating branch dependencies in apps except during short migration
  windows
- prefer exact Git tags in app `pubspec.yaml` once extracted
- keep package versions independent at first, but align breaking migration waves
  in release notes

Suggested initial tags:

```text
rk_core     v0.1.0
rk_data     v0.1.0
rk_media    v0.1.0
rk_agents   v0.1.0
rk_ai       v0.1.0
rk_branding v0.1.0
rk_ui       v0.1.0
```

## Migration Plan

### Phase 1: Freeze Package Contents

- run `tooling/scripts/validate-all.ps1`
- confirm root packages analyze clean
- add minimal tests for `rk_data`, `rk_media`, `rk_ui`, and `rk_branding`
  where low-risk
- ensure each package has a README before extraction

### Phase 2: Create Package Repos

Create empty GitHub repos under `random-knights` in dependency order.

Do not push app code or unrelated workspace files into package repos.

### Phase 3: Split Package Histories

Options:

1. simple copy-first extraction
2. `git subtree split` to preserve package history
3. keep packages root-tracked and mirror to repos later

Recommended default:

- use copy-first extraction for the first wave unless preserving history is a
  hard requirement
- root `dev-kitt` remains the integration workspace until standalone package
  consumption is proven

### Phase 4: Add Package Repo Remotes Locally

For each extracted package repo:

```powershell
git clone git@github-devkitt:random-knights/rk_core.git <LOCAL_WORKSPACE_PATH>
```

Copy package files into the repo, commit, tag, and push.

### Phase 5: Switch App Dependencies

After package repos are tagged, migrate app `pubspec.yaml` dependencies from
local paths to Git tags one app at a time:

```yaml
rk_core:
  git:
    url: git@github-devkitt:random-knights/rk_core.git
    ref: v0.1.0
```

Recommended app order:

1. `rand0m`
2. `out1ine`
3. `up10ad`
4. `knight1y`

Knight1y should move last because it consumes the most packages.

### Phase 6: Decide Root Workspace Role

After apps consume standalone package repos successfully:

- keep `packages/*` in `dev-kitt` as integration mirrors, or
- remove `packages/*` from root and rely on Git dependencies, or
- adopt a workspace tool such as Melos to manage local package checkout paths

Do not remove root packages until every app validates against the extracted
repos.

## pub.dev vs GitHub-Only

Recommended initial state: GitHub-only for every package.

| Package | Initial distribution | Future pub.dev suitability |
| --- | --- | --- |
| `rk_core` | GitHub tag | possible, but ecosystem-specific |
| `rk_data` | GitHub tag | possible after persistence contracts stabilize |
| `rk_media` | GitHub tag | possible after real consumers/tests |
| `rk_ai` | GitHub tag | possible if provider metadata policy is maintained |
| `rk_agents` | GitHub tag | low unless split into generic contracts/catalog |
| `rk_branding` | GitHub tag | low; brand-specific |
| `rk_ui` | GitHub tag | low-medium; brand/ecosystem-specific |

Do not publish to pub.dev until:

- every package has README/API docs
- every package has tests or widget smoke tests
- public API churn slows down
- package descriptions clearly state ecosystem specificity
- license and asset ownership are settled

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| `rk_branding` omitted from target org list | `rk_ui` cannot resolve dependencies independently | Add `rk_branding` repo or fold it into `rk_ui` before extraction. |
| App dependency churn | All apps may need pubspec updates | Extract and switch one dependency layer at a time. |
| Version skew | Apps may consume incompatible package tags | Use tagged refs and release notes. |
| Insufficient tests | Package APIs can drift silently | Add minimal tests before each package leaves root. |
| Root workspace confusion | Packages may exist both in root and standalone repos | Document whether root packages are mirrors, source, or integration checkouts. |
| Publishing too early | Public consumers inherit unstable APIs | Keep GitHub-only until `v1.0.0` readiness. |

## Exact Next Steps

1. Decide whether `rk_branding` is added to the final org structure.
2. Create READMEs for packages that do not have package-level documentation.
3. Add minimal tests for `rk_data`, `rk_media`, `rk_branding`, and `rk_ui`.
4. Run `tooling/scripts/validate-all.ps1`.
5. Create `random-knights/rk_core` first.
6. Extract `rk_core`, commit, tag `v0.1.0`, and push.
7. Repeat extraction in dependency order.
8. Switch app dependencies from local paths to Git tags one app at a time.
9. Keep app repo renames and package extraction as separate execution phases.

## Recommended Next Phase

```text
Begin Ecosystem Repository Phase CE: Package Repo README/Test Readiness.

Goal:
Prepare each shared package for standalone repository extraction by adding or
verifying package READMEs and minimal tests, without moving code or changing
remotes.

Focus:
- rk_core
- rk_data
- rk_media
- rk_agents
- rk_ai
- rk_branding decision
- rk_ui
```
