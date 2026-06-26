# ADR 0001: Monorepo Strategy

## Status

Proposed

## Context

Random Knights, XYZ is growing from a single Flutter/Firebase app into an
ecosystem of related apps, support modules, shared packages, Firebase Functions,
assets, AI agents, and local tools.

The ecosystem is expected to include:

- Apps: `rand0m`, `up10ad`, `out1ine`, and `knight1y`.
- Support modules: `c1assr00m` and `e1even`.
- Shared packages: `rk_core`, `rk_ai`, `rk_ui`, `rk_connections`,
  `rk_agents`, `rk_pages`, `rk_media`, `rk_security`, and `rk_platform`.

These products will share authentication, Firebase integration, AI provider
contracts, agent manifests, media catalogs, UI foundations, security helpers,
and environment configuration. At the same time, the current app is active and
should not be destabilized by a large structural migration.

The repo also needs to remain friendly to future contributors, CI/CD, secure
local development, Firebase emulators, and separate dev/test/prod environments.

## Decision

Prepare this repository for a Flutter/Firebase monorepo using shared packages,
but migrate incrementally.

The monorepo will be organized around:

- `apps/` for product apps.
- `packages/` for shared Dart/Flutter packages.
- `backend/` for Firebase Functions, Firebase rules, indexes, and backend
  contracts.
- `modules/` for support domains such as `c1assr00m` and `e1even`.
- `docs/` for architecture notes and decision records.
- `tooling/` for local scripts, workspace automation, emulator helpers, and
  local AI agent/tool support.

The current app code should remain in place until each boundary is proven. Code
will move only when it is safe, small, and testable. Package extraction should
start with low-risk shared contracts and pure code, then progress toward UI,
Firebase integrations, agents, media, pages, and app shells.

Dependency direction should flow from apps down into shared packages. Shared
packages must not import from app code. `rk_core` should remain the lowest-level
package and avoid dependencies on other Random Knights packages.

## Consequences

Positive consequences:

- Multiple apps can share stable foundations without copying code.
- Firebase Functions, rules, and app clients can evolve together.
- CI can analyze and test affected apps/packages in a single workspace.
- Contributors get one clear place to understand architecture and conventions.
- Shared AI, agent, media, security, and platform contracts can mature before
  being published or split into separate repos.
- Local emulator and local agent processes can be standardized across apps.

Tradeoffs:

- The repo will become structurally larger and will need stronger conventions.
- Package boundaries introduce overhead when making cross-cutting changes.
- Workspace tooling, such as Melos, CI scripts, and package versioning, must be
  maintained.
- Incremental migration means there will be a transition period where some code
  remains in legacy app folders while new packages are introduced.

Risks:

- Moving too much too early could break the current app.
- Shared packages can become dumping grounds without clear ownership.
- Asset paths and Firebase environment configuration need careful handling
  during extraction.
- Generated files, <ENV_VAR>, build outputs, and local tool artifacts must remain
  controlled by `.gitignore` and contributor docs.

## Rejected Alternatives

### Keep Everything In One App Folder

This is simplest short term, but it encourages duplicated code as `rand0m`,
`up10ad`, `out1ine`, and `knight1y` diverge. It also makes shared AI, Firebase,
media, and agent contracts harder to test and reuse.

### Split Into Many Repositories Immediately

Separate repos could create clean ownership boundaries, but they would add
coordination cost before the package APIs are stable. This would make local
development, CI, and cross-package changes slower during the discovery phase.

### Big-Bang Monorepo Migration

Moving the current app, backend, assets, and packages all at once would create a
large blast radius and make regressions difficult to isolate. The ecosystem
needs a migration path that protects the running app.

### Publish Shared Packages First

Publishing packages before their boundaries are proven would lock in unstable
APIs. The packages should mature inside the monorepo before any public release
or separate repository mirror.

## Next Steps

1. Keep documenting the target ecosystem and package boundaries.
2. Add workspace tooling that can support apps and packages without changing app
   behavior.
3. Confirm `.gitignore` covers generated artifacts, <ENV_VAR>, build outputs,
   Firebase caches, and dependency folders.
4. Create package folders only when there is a clear first extraction target.
5. Start with `rk_core` for pure models, IDs, result types, and shared
   contracts.
6. Extract `rk_ai` contracts after pure shared types are stable, while keeping
   provider <ENV_VAR> and privileged calls in Firebase Functions.
7. Move UI, connections, agents, media, pages, security, and platform concerns
   in small phases with analysis/tests after each meaningful change.
8. Add CI checks for Flutter analysis, package tests, Firebase Functions builds,
   rules tests, formatting, and <ENV_VAR> scanning.
