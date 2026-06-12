# Ecosystem Shell Contract

## Status

This document is the architectural source of truth for the shared ecosystem
shell across:

- `apps/knight1y`
- `apps/rand0m`
- `apps/out1ine`
- `apps/up10ad`

The contract defines the intended navigation model, dashboard model, app
identity model, and shared feature ownership before additional extraction work
begins. It is planning-only until an implementation phase explicitly changes
app source.

## Shell Goals

Every app should feel like part of one ecosystem while preserving the reason
that app exists. The shared shell should make common destinations predictable,
keep app-specific work easy to find, and support future shared modules without
forcing every app to implement the same feature set at the same time.

The final top-level navigation contract is:

```text
Dashboard | About | Primary | Connections | More
```

Each app must expose those five destinations in that order. Labels may be
styled by the app, but the semantic destinations should remain stable.

The drawer contract uses the same semantic navigation model as the bottom
navigation. It may expose more destinations, but its first section should be
generated from the shared shell contract before app-specific entries are added.

## App Identity Contract

Each app needs a small identity object owned by `rk_core`.

Required identity fields:

- app ID
- display name
- short role
- primary page label
- domain
- capability metadata
- app accent or brand metadata reference
- enabled shared modules

Current app identities:

| App ID | Display Name | Role | Domain | Primary |
| --- | --- | --- | --- | --- |
| `rand0m` | Rand0m | Public root/chat landing app | `rand0m.ai` | Chat |
| `knight1y` | Knight1y | Full premium/power-user app | `knight1y.rand0m.ai` | Agents |
| `out1ine` | Out1ine | Oracle/lightweight future test app | `out1ine.rand0m.ai` | Test / Oracle |
| `up10ad` | Up10ad | Creative render/upload tool | `up10ad.rand0m.ai` | Render |

App identity should not include <ENV_VAR>, Firebase options, environment values,
deployment credentials, or runtime service instances.

Capability metadata should describe whether an app exposes a destination at the
contract level. It should not decide route visibility, authentication state,
<ENV_VAR>/test access, or user permissions by itself. Apps remain responsible for
enforcing those rules locally.

## Navigation Contract

### Dashboard

Dashboard is the common ecosystem home surface. It should be shared across apps
as a shell and layout contract, with room for app-specific sections.

Dashboard owns:

- high-level ecosystem overview
- reusable cards and modules
- app status summaries
- common launch points
- app-specific dashboard sections

Dashboard does not own:

- the full primary process of an app
- detailed settings
- deep runtime configuration
- API key or environment management

### About

About is the shared app/ecosystem information area.

About owns:

- shared About architecture
- ecosystem and app identity presentation
- app-specific content blocks
- app-specific API/env management blocks where the app already owns that
  runtime configuration

About does not own:

- shared <ENV_VAR>
- cross-app credential storage
- Firebase configuration
- package dependency configuration

### Primary

Primary is the reason the app exists. It must remain app-owned because it is
where each app's strongest product identity lives.

Primary pages by app:

| App | Primary Page |
| --- | --- |
| `rand0m` | Chat |
| `knight1y` | Agents |
| `out1ine` | Test / Oracle |
| `up10ad` | Render |

Primary owns:

- the main process
- process-specific state and controls
- app-owned runtime behavior
- feature-specific history and persistence until a shared contract exists

Primary does not own:

- generic ecosystem navigation
- cross-app launcher behavior
- shared shell layout primitives

### Connections

Connections is the shared ecosystem connections page.

Connections owns:

- ecosystem connection surfaces
- shared connection UI states
- app-to-app relationship presentation
- future shared service connection contracts

Connections does not own:

- provider <ENV_VAR>
- app-local OAuth/Firebase setup
- network implementations until a future data/service package defines them

### More

More is the cross-app launcher and future extension surface.

More owns:

- cross-app launcher
- Weather
- Draw
- Out1ine/Oracle entry points
- ecosystem tools
- future feature discovery
- links into app-owned feature surfaces

More does not own:

- the full dashboard overview
- the app's main process
- long-lived runtime orchestration
- <ENV_VAR> or environment management

## Drawer Contract

The shared drawer should be generated from `rk_core` contracts and app-owned
capability metadata. It should not hardcode page classes, route names, Firebase
state, environment state, or user-specific access decisions.

Drawer sections:

| Section | Destinations | Ownership |
| --- | --- | --- |
| Shared top section | Dashboard, About, Primary, Connections, More | `rk_core` enum/order, `rk_ui` drawer widget |
| Shared ecosystem tools | Draw, Weather, Orac1es | `rk_core` destination enum, app-owned callbacks |
| App-specific section | App-owned extras and reserved future tools | App source chooses callbacks and visibility |

Shared top section order:

```text
Dashboard | About | Primary | Connections | More
```

Shared ecosystem tools:

```text
Draw | Weather | Orac1es
```

App-specific drawer destinations:

| App | Destinations |
| --- | --- |
| `knight1y` | History, Test, Relax, Spotify |
| `rand0m` | None currently |
| `out1ine` | Reserved future Test Lab |
| `up10ad` | Reserved future Media Studio |

Drawer destination enum values owned by `rk_core`:

- `dashboard`
- `about`
- `primary`
- `connections`
- `more`
- `draw`
- `weather`
- `oracles`
- `history`
- `test`
- `relax`
- `spotify`

App capability flags owned by `rk_core`:

| Capability | Meaning |
| --- | --- |
| `supportsHistory` | App has a local History destination. |
| `supportsTest` | App has a local Test/<ENV_VAR>/lab destination. |
| `supportsRelax` | App has a local Relax destination. |
| `supportsSpotify` | App has a local Spotify destination. |
| `supportsRender` | App owns a Render primary or tool destination. |
| `supportsChat` | App owns a Chat primary or tool destination. |
| `supportsAgents` | App owns an Agents destination. |

Initial capability map:

| App | Capabilities |
| --- | --- |
| `rand0m` | `supportsChat` |
| `knight1y` | `supportsHistory`, `supportsTest`, `supportsRelax`, `supportsSpotify`, `supportsChat`, `supportsAgents` |
| `out1ine` | none beyond its primary contract for now |
| `up10ad` | `supportsRender` |

The drawer widget planned for `rk_ui` should accept callbacks for destination
selection rather than route directly. Apps should continue to decide whether a
destination opens a page index, pushes a route, opens a modal, shows a disabled
state, or remains hidden because of app-specific rules.

`rk_ui` now provides `EcosystemDrawer` as the shared drawer primitive. The
widget consumes:

- `EcosystemShellConfig`
- `EcosystemAppDefinition`
- `EcosystemNavSlot`
- `EcosystemDrawerDestination`
- optional disabled destination metadata

`EcosystemDrawer` renders sections in this order:

1. Shared top section from `EcosystemNavigation.drawerTopSection`.
2. Shared ecosystem tools from `EcosystemNavigation.drawerEcosystemTools`.
3. App-specific destinations derived from `EcosystemAppDefinition.capabilities`.
4. Optional disabled destinations explicitly provided by the app.

It does not call `Navigator`, import app pages, inspect app routes, or decide
<ENV_VAR>/auth visibility. Apps must provide callbacks when they wire the drawer.

## Dashboard Contract

Dashboard should be a composable layout that can accept shared modules and
app-specific modules. Shared modules should be optional so apps can adopt them
incrementally.

Shared dashboard modules:

| Module | Purpose | Future Package |
| --- | --- | --- |
| Flipcard | Compact identity, summary, or rotating feature card | `rk_ui` |
| Status | Common status/readiness surface | `rk_ui` |
| Weather | Shared weather summary shell | `rk_ui`, future `rk_data` |
| Connections | Connection summary and quick links | `rk_ui`, future `rk_core` |
| Cross-app launcher | Launch and discover ecosystem apps/features | `rk_ui`, future `rk_core` |

App-specific dashboard modules:

| App | Modules |
| --- | --- |
| `knight1y` | Agent status, History, Runtime metrics |
| `rand0m` | Chat status, Provider status |
| `out1ine` | Oracle/Test status |
| `up10ad` | Render queue, Render history |

Dashboard modules should follow these rules:

- shared modules receive app identity and state through explicit inputs
- app-specific modules may live in app source until shared boundaries are clear
- modules should not read `.env`, Firebase config, or app-local persistence
  directly
- modules should not assume every app has the same providers or runtime
  capabilities

## Shared Page Ownership

Shared page architecture belongs in root packages only after it has a stable,
app-neutral contract.

| Page Area | Shared Ownership | App Ownership |
| --- | --- | --- |
| Dashboard | Shell, layout, shared cards/modules | App-specific sections and runtime status data |
| About | Shared identity layout and common sections | App copy, API/env blocks, app-specific metadata |
| Connections | Shared visual shell and connection states | Runtime provider details and app-local setup |
| More | Launcher layout and shared feature entry points | Feature availability, app-local routes, app-specific labels |

Shared pages should not directly own route implementations, Firebase setup,
environment loading, Hive boxes, provider clients, or generated platform
configuration.

## App-Specific Page Ownership

Primary remains app-owned until a later phase explicitly extracts stable
subcomponents.

| App | App-Owned Primary Surface | Keep App-Local For Now |
| --- | --- | --- |
| `rand0m` | Chat | provider setup, chat runtime, message persistence |
| `knight1y` | Agents | agent runtime orchestration, history persistence, metrics source |
| `out1ine` | Test / Oracle | oracle/test runtime, draw/weather experiments, result history |
| `up10ad` | Render | media selection, render queue execution, output history |

Reusable UI may be extracted from these pages, but behavior should stay
app-owned until there is an explicit service or data contract.

## Package Ownership Map

Recommended future package ownership:

| Package | Ownership |
| --- | --- |
| `rk_ui` | Shell widgets, navigation widgets, shared drawer widget, shared dashboard widgets, splash/progress widgets |
| `rk_branding` | Colors, fonts, logos, branding metadata |
| `rk_core` | Ecosystem enums, app IDs, navigation and drawer contracts, app capabilities, shared constants |
| `rk_media` | Render/media abstractions |

Existing packages should remain narrow:

- `rk_ui` can receive visual widgets that do not depend on app runtime.
- `rk_branding` can receive static brand primitives and metadata.
- `rk_agents` should continue to own agent definitions and metadata, not shell
  navigation.
- `rk_ai` should continue to own provider/model value objects, not app runtime
  clients.

Future packages should be introduced only when their contracts are stable:

- `rk_core` owns app identity and navigation contracts.
- `rk_media` after render/media DTOs and queue abstractions are understood.

## More vs Dashboard vs Primary

Use this rule of thumb before moving a feature:

| Destination | Belongs Here When |
| --- | --- |
| Dashboard | The user needs a high-level summary, status, quick action, or ecosystem overview. |
| Primary | The user is doing the app's main job. |
| More | The user is discovering secondary tools, shared utilities, cross-app launches, or optional modules. |

Examples:

- Weather summary card belongs on Dashboard.
- Full weather process, if it becomes a tool, belongs under More.
- Chat status belongs on Rand0m Dashboard.
- Chat itself belongs in Rand0m Primary.
- Render queue summary belongs on Up10ad Dashboard.
- Render execution belongs in Up10ad Primary.
- Cross-app app launch belongs in More, with optional Dashboard shortcut cards.

## Implementation Roadmap

Recommended implementation order after this contract is approved:

1. Keep `rk_core` focused on app IDs, app identity value objects, navigation
   enum, and shell destination contracts.
2. Keep shared shell/navigation widgets in `rk_ui` using `rk_core` contracts.
3. Keep the shared dashboard layout in `rk_ui` with placeholder module slots.
4. Use the `rk_core` app registry as the shared identity source.
5. Migrate one low-risk app first, preferably `out1ine`, to validate the shell
   without disturbing the heavier Knight1y runtime.
6. Migrate `rand0m`, then `up10ad`, then `knight1y`.
7. Extract shared dashboard modules incrementally: Flipcard, Status,
   Connections, Weather summary, then Cross-app launcher.
8. Extract splash/progress widgets after shell navigation is stable.
9. Extract the shared drawer widget from the drawer contract, starting with
   Knight1y's current drawer as the richest reference while preserving all
   app-owned callbacks.
10. Revisit `rk_media` once Up10ad render concepts have stable DTOs and queue
   abstractions.

## Recommended Phase Q Command

```text
Begin Ecosystem Shell Phase Q: Wire Out1ine To Shared Shell.

Working directory:
<LOCAL_WORKSPACE_PATH>

Goal:
Wire apps/out1ine to the shared rk_core/rk_ui shell contracts as the first
low-risk app migration, preserving existing runtime behavior.

Tasks:
1. Add path dependencies to apps/out1ine only if missing: rk_core and rk_ui.
2. Introduce an Out1ine shell config from EcosystemApps.out1ine.
3. Wrap existing Out1ine top-level body with EcosystemShell without changing
   primary runtime behavior.
4. Map existing navigation callbacks to EcosystemNavSlot, keeping current pages
   and route behavior intact.
5. Add the shared More sheet callback surface without enabling new routes unless
   an existing local page already supports them.
6. Run flutter pub get and flutter analyze for apps/out1ine.
7. Run analyze for rk_core, rk_ui, and existing shared packages.

Return:
- files created
- app files changed
- shell wiring summary
- validation results
- recommendation for next app migration
```
