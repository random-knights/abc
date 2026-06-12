# Random Knights Ecosystem Blueprint

> Status (2026-06-11): Reframed for the single-app architecture. Random Knights
> ships as **one** Flutter web app, `apps/rand0m` (rand0m.ai). The earlier
> four-app model (`rand0m`, `up10ad`, `out1ine`, `knight1y`) is **retired** —
> those names now describe feature surfaces, routes, and legacy compatibility
> metadata inside the single app, not separate products. See "Retired Four-App
> Model" below.

Random Knights, XYZ is a Flutter and Firebase platform for creative tools,
AI-assisted processes, privacy-aware connections, and playful agent-driven
experiences. It is delivered as a single app backed by reusable `rk_*` packages.
The platform should feel imaginative on the surface and disciplined underneath:
shared packages, secure local development, transparent AI behavior, and clean
domain boundaries between feature surfaces, backend services, and media.

## Platform Mission

Build one connected app that helps people capture ideas, shape them into
structured work, share them safely, and collaborate with specialized AI agents
without hiding cost, privacy, source, or environmental tradeoffs.

The platform should prioritize:

- Human agency over opaque automation.
- Reusable product foundations that serve the single app and any future app.
- Transparent AI provider, model, cost, <ENV_VAR>, and impact reporting.
- Secure defaults for local development and production environments.
- Contribution paths that future open-source collaborators can understand.
- A package, plugin, and agent architecture that can grow without rewrites.

## The Single App: rand0m

There is one active app: `apps/rand0m`, served at rand0m.ai. It is a creative
launcher, multi-provider AI surface, agent command space, Earth Intelligence
console, and utility hub in one shell. What were once envisioned as separate
apps are now feature surfaces (pages/routes) inside it.

Feature surfaces inside `apps/rand0m`:

| Surface | Role | Notes |
| --- | --- | --- |
| Home / XYZ | Landing, discovery, active-agent terminal | Default `/` route |
| `random1y` | Multi-provider AI chat | Provider/model selection, AIEDS impact disclosure |
| `knight1y` | Agent command space | Roster, chat, history; a page, never the default route |
| `c0nnect` / Earth | Connection graph + Earth Intelligence console | Two cooperating domains, distinct ownership |
| `oracles` | Oracle content experiences | — |
| `uti1ity` / Test Inspect | Local tooling and test generation | — |
| `weather`, `draw`, `relax`, `vibe`, `favorites`, `about` | Utility and personalization surfaces | Plain-named, non-AI utilities |

Learning/onboarding (`c1assr00m`) and operations/evaluation (`e1even`) are future
*capabilities*, not separate apps. If built, they ship as surfaces or tooling
within the single app or the automation repos, opting into shared `rk_*`
contracts rather than becoming hidden dependencies.

## Retired Four-App Model

The original blueprint described four products — `rand0m`, `up10ad`, `out1ine`,
and `knight1y` — with separate user needs and a per-app capability matrix. That
model is **retired**. Do not reintroduce it in navigation, deployment, package
guidance, or documentation.

What remains of those names:

- They are valid **feature/route identities** inside `apps/rand0m` (e.g. the
  `knight1y` page, the `random1y` chat surface).
- Package contracts and the env contract may still expose them as **legacy
  compatibility metadata** (IDs, labels, capabilities, reserved `<ENV_VAR>*` env
  keys, legacy icon IDs). Treat those as compatibility metadata; do not delete or
  rename them without an explicitly scoped package/env phase.
- They no longer imply separate apps, separate deploy targets, or separate
  Firebase hosting sites.

## Shared Feature Strategy

Shared features should move into packages when at least two apps need them or
when the feature represents a platform contract.

Shared foundations:

- Authentication, app boot, environment selection, and Firebase initialization.
- Theme <ENV_VAR>, reusable widgets, progress indicators, error states, and layout
  primitives.
- AI provider contracts, model metadata, <ENV_VAR>/cost/impact estimates, and
  prompt/response types.
- Agent manifests, agent registry, tool contracts, settings, history, and usage
  records.
- Asset catalogs for avatars, books, icons, audio, video, and brand media.
- Firestore, Functions, Storage, weather, location, and web integration clients.
- Security helpers for URL scanning, file validation, permission checks, and
  <ENV_VAR> handling.

App-specific code should stay local when it controls routing, product tone,
page composition, app-specific Firebase project selection, or brand-specific
media.

## AI Transparency, Privacy, and Environment Principles

AI features should expose enough information for users and maintainers to
understand what happened.

Principles:

- Show provider and model whenever an AI response is displayed or logged.
- Track input <ENV_VAR>, output <ENV_VAR>, estimated cost, and estimated CO2e where
  supported or reasonably estimated.
- Keep provider API keys and privileged calls on the backend, not in Flutter
  clients.
- Prefer Firebase Functions as the provider boundary for production AI calls.
- Separate dev, test, and prod environments for data, keys, and deploy targets.
- Never commit `.env` files or private service credentials.
- Make local emulator processes the default for contributor setup.
- Give users clear boundaries around uploads, file metadata, retained history,
  and agent memory.
- Treat agent prompts, tools, and output logs as inspectable platform objects,
  not hidden magic.

Environmental reporting should be framed as an estimate. The platform should not
pretend <ENV_VAR>-based impact math is exact, but it should make tradeoffs visible.

## Connection System Concept

Connections are typed relationships between people, apps, agents, uploads,
outlines, media, tools, tasks, and external services.

Examples:

- A media item connects to a structured outline or note.
- An outline connects to an agent conversation in the `knight1y` surface.
- An agent response connects to provider/model/cost/impact metadata.
- A guided lesson connects to a reusable process template.
- An evaluation run connects to agent versions and test fixtures.

(These are relationships between surfaces and objects inside the single app, not
edges between separate apps.)

The connection system should eventually provide:

- Stable IDs for connected objects.
- Typed edges such as `created_from`, `summarized_by`, `validated_by`,
  `published_to`, `reviewed_by`, and `generated_with`.
- Firestore-backed storage with security rules per object type.
- Local-first development through Firebase emulators.
- UI components for browsing provenance, related work, and agent/tool history.

This concept belongs partly in `rk_core` for types, `rk_data` for persistence,
`rk_agents` for agent/tool edges, and `rk_ui` for visualization.

## Package Extraction Strategy

> Current real packages (2026-06): `rk_core`, `rk_data`, `rk_media`, `rk_agents`,
> `rk_ai`, `rk_branding`, `rk_ui`. The target direction below is aspirational and
> names some packages (`rk_pages`, `rk_connections`, `rk_security`, `rk_platform`)
> that do not exist yet; treat it as direction, not current state. Persistence and
> Firebase adapters currently live in `rk_data`; branding/theme in `rk_branding`
> and `rk_ui`.

Target package direction:

```text
apps/*
  -> rk_pages
  -> rk_agents
  -> rk_ui
  -> rk_ai
  -> rk_connections
  -> rk_media
  -> rk_security
  -> rk_platform
  -> rk_core

rk_pages -> rk_ui, rk_agents, rk_ai, rk_connections, rk_media, rk_platform, rk_core
rk_agents -> rk_ai, rk_security, rk_media, rk_core
rk_ai -> rk_security, rk_core
rk_connections -> rk_security, rk_platform, rk_core
rk_ui -> rk_media, rk_core
rk_media -> rk_core
rk_security -> rk_core
rk_platform -> rk_core
rk_core -> no Random Knights package dependencies
```

Package ownership:

- `rk_core`: Pure Dart models, IDs, result types, serialization contracts,
  shared constants, and connection primitives.
- `rk_ai`: Provider labels, model metadata, AI request/response contracts,
  usage and impact estimates, prompt/tool interfaces, and local agent contracts.
- `rk_ui`: Theme <ENV_VAR>, common widgets, layout primitives, motion components,
  progress indicators, and reusable visual language.
- `rk_connections`: Firebase clients, Firestore/Storage/Functions adapters,
  external service clients, location/weather/web integration wrappers.
- `rk_agents`: Agent registry, manifests, prompts, settings, history,
  tool routing, agent-specific domain services.
- `rk_pages`: Shared page compositions used by multiple apps, kept above domain
  packages and below app shells.
- `rk_media`: Asset catalogs, media loaders, avatar/book/icon/video references,
  generated asset accessors, shared media metadata.
- `rk_security`: <ENV_VAR> validation, permission checks, URL/file scanning,
  audit helpers, abuse-prevention primitives.
- `rk_platform`: App boot, environment loading, Firebase option selection,
  platform adapters, emulator/development mode wiring.

Extraction order:

1. Move pure models and constants into `rk_core`.
2. Move theme <ENV_VAR> and low-risk reusable widgets into `rk_ui`.
3. Move AI contracts and usage estimates into `rk_ai`; keep <ENV_VAR> in Functions.
4. Move Firebase and external service adapters into `rk_connections`.
5. Move agent manifests, settings, history, and tool contracts into `rk_agents`.
6. Move asset catalogs and generated media references into `rk_media`.
7. Move shared screens into `rk_pages` only after their dependencies are clean.
8. Add `rk_security` and `rk_platform` as cross-cutting packages where current
   app code proves the boundary.

## Firebase and Environment Strategy

Each app should support dev, test, and prod Firebase projects. Local development
should run against emulators by default, with explicit opt-in for remote dev.

Recommended layout:

```text
backend/
  firebase/
    firebase.json
    firestore.rules
    firestore.indexes.json
    storage.rules
  functions/
    src/
      ai/
      agents/
      connections/
      media/
      security/
      tasks/

apps/<app>/
  firebase/
    dev/
    test/
    prod/
```

Functions should own privileged AI provider calls, webhook verification, media
processing, security scans that require <ENV_VAR>, and scheduled automation.
Flutter clients should call typed Functions through `rk_connections` and
exchange AI-specific contracts from `rk_ai`.

## Contributor and Local Agent Strategy

Future contributors should be able to run a useful local version without access
to production <ENV_VAR>.

Recommended defaults:

- `.env.example` files instead of real `.env` files.
- Firebase Emulator Suite for Auth, Firestore, Functions, and Storage.
- Seed data for agents, sample uploads, outlines, and connection graphs.
- Local agent/tool manifests under `tooling/local_agents`.
- CI checks that run without private production credentials.
- Clear docs for adding an app, package, Firebase Function, agent, or tool.

Local AI agents and tools should be registered through manifests, declare their
permissions, and produce inspectable logs. The system should treat local tools as
powerful integrations with explicit boundaries, not invisible app internals.
