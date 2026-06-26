# App Shell Contract

## Status

The ecosystem shell contract is implemented as shared contracts and reusable UI
primitives. App feature behavior remains app-owned unless a focused wiring
phase explicitly changes it.

## App Definitions

Each app is described by `rk_core` using:

- metadata: app ID, role, display name, domain
- navigation: primary destination, primary label, shell slot visibility
- shell config: UI-neutral shell configuration
- capabilities: feature flags and app-specific drawer destinations

| App | App ID | Role | Domain | Primary |
| --- | --- | --- | --- | --- |
| rand0m | `rand0m` | `publicRoot` | `rand0m.ai` | Chat |
| knight1y | `knight1y` | `premium` | `knight1y.rand0m.ai` | Agents |
| out1ine | `out1ine` | `oracle` | `out1ine.rand0m.ai` | Orac1es |
| up10ad | `up10ad` | `mediaTool` | `up10ad.rand0m.ai` | Render |

## Bottom Navigation

All ecosystem apps use this semantic order:

```text
Dashboard | About | Primary | Connections | More
```

Slot ownership:

| Slot | Shared Ownership | App Ownership |
| --- | --- | --- |
| Dashboard | shell layout, shared dashboard cards and sections | app-specific status modules and runtime data |
| About | layout, sections, cards, branding hooks | app copy, app-specific API/env blocks, version data |
| Primary | semantic slot only | app's main process and runtime behavior |
| Connections | shell and presentation primitives | provider setup, connection state, <ENV_VAR> |
| More | launcher and destination presentation | callbacks, disabled states, route choices |

## Drawer

Drawer sections:

| Section | Destinations |
| --- | --- |
| Shared top section | Dashboard, About, Primary, Connections, More |
| Shared ecosystem tools | Draw, Weather, Orac1es |
| App-specific | capability-derived app destinations |

App-specific drawer capabilities:

| App | Destinations |
| --- | --- |
| `knight1y` | History, Test, Relax, Spotify |
| `rand0m` | none currently |
| `out1ine` | reserved future Test Lab |
| `up10ad` | reserved future Media Studio |

The drawer widget is callback-based. It must not import app pages, call app
routes directly, inspect Firebase state, load environment values, or decide
<ENV_VAR>/test visibility.

## What Is Shared

- app metadata and shell contracts in `rk_core`
- shell, bottom nav, drawer, More sheet, dashboard, About, weather, oracle, and
  splash/progress UI primitives in `rk_ui`
- brand colors and fonts in `rk_branding`
- agent and AI value contracts in `rk_agents` and `rk_ai`
- future media and data contracts in `rk_media` and `rk_data`

## What Remains App-Owned

- primary processes
- page indices and route callbacks
- splash/auth landing decisions
- Firebase and `.env` setup
- provider clients and API calls
- Hive stores, migrations, and generated adapters
- weather location/refresh logic
- oracle generation, custom GIF handling, and persistence
- render/upload/FFmpeg processes
- <ENV_VAR>/test access rules

## Not Wired Yet

The app shell can consume existing shared shell primitives, but the new
dashboard/about/weather/oracle/data/media contracts should not be treated as
fully adopted by app features until a dedicated wiring phase maps each app's
runtime inputs and verifies behavior.

## Next Wiring Order

1. Align app shell config construction with `EcosystemApps.*.shellConfig`.
2. Wire shared dashboard shell usage in one app and preserve app-specific
   modules.
3. Wire shared About shell usage in one app and preserve app-owned content.
4. Wire weather presentation widgets using app-owned providers.
5. Wire oracle presentation widgets using app-owned oracle logic.
6. Introduce `rk_media` contracts to render/GIF/audio metadata only after app
   DTO boundaries are stable.
7. Introduce `rk_data` contracts to history/audit/runtime inspection only after
   storage boundaries are stable.
