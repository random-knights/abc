# rk_core Scaffold

## Status

`packages/rk_core` is the pure Dart contract package for ecosystem identity and
navigation. It does not wire apps to shared shell behavior yet.

## Package Rules

`rk_core` must remain:

- pure Dart
- Flutter-free
- Firebase-free
- Hive-free
- asset-free
- generated-code-free
- independent of app imports

The package may define enums, immutable value objects, registries, constants,
and helper lookups that describe the ecosystem. It should not own runtime
services, UI widgets, route implementations, credentials, or persistence.

## Current Public API

The package exports:

- `EcosystemAppId`
- `EcosystemAppRole`
- `EcosystemAppCapability`
- `EcosystemAppMetadata`
- `EcosystemAppCapabilities`
- `EcosystemAppNavigation`
- `EcosystemAppShellConfig`
- `EcosystemAppDefinition`
- `EcosystemApps`
- `EcosystemNavSlot`
- `EcosystemPrimaryDestination`
- `EcosystemDrawerDestination`
- `EcosystemNavigation`

Current app definitions:

| App ID | Role | Display | Domain | Primary |
| --- | --- | --- | --- | --- |
| `rand0m` | `publicRoot` | `rand0m` | `rand0m.ai` | `chat` |
| `knight1y` | `premium` | `knight1y` | `knight1y.rand0m.ai` | `agents` |
| `out1ine` | `oracle` | `out1ine` | `out1ine.rand0m.ai` | `testOracle` |
| `up10ad` | `mediaTool` | `up10ad` | `up10ad.rand0m.ai` | `render` |

Final shell navigation order:

```text
Dashboard | About | Primary | Connections | More
```

Drawer contracts:

| Contract | Values |
| --- | --- |
| Shared top section | Dashboard, About, Primary, Connections, More |
| Shared ecosystem tools | Draw, Weather, Orac1es |
| App-specific destinations | History, Test, Relax, Spotify |

Capability metadata:

| App ID | Capability Flags |
| --- | --- |
| `rand0m` | `supportsChat` |
| `knight1y` | `supportsHistory`, `supportsTest`, `supportsRelax`, `supportsSpotify`, `supportsChat`, `supportsAgents`, `supportsPremiumFeatures` |
| `out1ine` | `supportsExperimentalFeatures` |
| `up10ad` | `supportsRender`, `supportsExperimentalFeatures` |

Capabilities describe which app-owned destinations exist. They do not grant
access, bypass auth, decide <ENV_VAR>/test visibility, or route directly.

## Consolidated App Definitions

Each `EcosystemAppDefinition` now centralizes the foundation data for an app:

- `metadata`: app ID, role, display name, and domain
- `navigation`: primary destination, primary label, and shell slot visibility
- `shellConfig`: UI-neutral shell configuration for future app wiring
- `capabilities`: feature flags plus registered capability helpers

Compatibility getters such as `id`, `role`, `domain`, `primaryDestination`, and
`primaryLabel` remain available so existing `rk_ui` consumers do not need to
move immediately.

The core shell config is intentionally UI-neutral. Icons, widgets, routes,
callbacks, auth rules, Firebase services, provider logic, and page
implementations remain app-owned or `rk_ui`-owned.

## Next Use

The next package should consume the drawer contracts from `rk_ui` to build a
shared drawer widget. Apps should keep route callbacks local until a specific
drawer wiring phase is approved.
