# rk_ui Shell Scaffold

## Status

`packages/rk_ui` now contains the first shared shell/navigation UI primitives
for the ecosystem shell. These widgets consume `rk_core` contracts and remain
callback-based. No app navigation behavior is wired yet.

## Package Dependencies

`rk_ui` may depend on:

- `rk_branding`
- `rk_core`
- Flutter SDK

It must not depend on app source, Firebase, Hive, environment loading, runtime
services, or generated code.

## Public Shell API

The package exports:

- `EcosystemShellConfig`
- `EcosystemShell`
- `EcosystemBottomNav`
- `EcosystemDrawer`
- `EcosystemDrawerDisabledDestination`
- `EcosystemDashboard`
- `EcosystemMoreSheet`
- `EcosystemMoreDestination`

The widgets use these `rk_core` contracts:

- `EcosystemAppId`
- `EcosystemAppDefinition`
- `EcosystemNavSlot`
- `EcosystemPrimaryDestination`
- `EcosystemDrawerDestination`
- `EcosystemNavigation`

## Widget Responsibilities

`EcosystemShellConfig` describes which shell slots are visible for an app and
how the app's Primary slot should be labeled.

`EcosystemBottomNav` renders the final shell slot order:

```text
Dashboard | About | Primary | Connections | More
```

It accepts a selected slot and a callback. It does not route.

`EcosystemDrawer` renders the shared drawer contract:

1. Shared top section from `EcosystemNavigation.drawerTopSection`.
2. Shared ecosystem tools from `EcosystemNavigation.drawerEcosystemTools`.
3. App-specific destinations from `EcosystemAppDefinition.capabilities`.
4. Optional disabled destinations supplied by the app.

It accepts `EcosystemShellConfig`, an app definition, current selection inputs,
disabled destination metadata, and a destination callback. It does not route,
read app source, import app pages, or decide <ENV_VAR>/auth visibility.

`EcosystemDashboard` renders placeholder shared and app sections. It accepts
optional section widgets but does not fetch app data.

`EcosystemMoreSheet` lists ecosystem destinations:

- Chat
- Agents
- Oracle/Test
- Render
- Draw
- Weather

It accepts a callback. It does not route.

`EcosystemShell` composes a `Scaffold`, caller-provided body, and shared bottom
navigation. It does not own route state.

## Next Use

The next wiring phase should add `EcosystemDrawer` to one low-risk app first,
preferably `rand0m`, because it has no current app-specific drawer section and
already uses the shared bottom navigation shell.
