# Package Boundary Map

This map records the local package boundary after Branding Phase 1B.

## Current Packages

### rk_branding

Purpose:

- Shared brand primitives.

Owns:

- `AppColors`
- `RKFonts`

May later own:

- Brand constants.
- Typography <ENV_VAR>.
- Logo path constants only after package asset strategy is agreed.
- Shared brand gradients only if they are true brand <ENV_VAR>.

Must not own:

- Widgets.
- Pages or routes.
- Runtime services.
- Hive models or adapters.
- Firebase config.
- App-specific `ThemeData` assembly.
- Launcher icon generation config.

### rk_ui

Purpose:

- Shared widgets, painters, progress components, and future reusable UI theme
  builders.

Owns:

- Progress components.
- Shared UI widgets.
- UI painters/motion helpers.

Depends on:

- `rk_branding` for color and font primitives when needed.

Must not own:

- App routes.
- Hive/runtime services.
- Firebase app config.
- App-specific assets.

### rk_agents

Purpose:

- Immutable agent definitions and policies.

Current boundary:

- Dart-only.
- No Flutter, Hive, Firebase, app routes, widgets, or services.

### rk_ai

Purpose:

- Shared AI contracts and pricing helpers.

Current boundary:

- Dart-only.
- No Flutter UI, Hive persistence, Firebase app config, app routes, widgets, or
  app runtime services.

## Direction Rules

Allowed:

- Knight1y app -> local packages.
- `rk_ui` -> `rk_branding`.

Not allowed:

- `rk_branding` -> `rk_ui`.
- `rk_branding` -> Knight1y.
- `rk_agents` -> Knight1y.
- `rk_ai` -> Knight1y.
- Local packages importing app pages, routes, Firebase config, Hive adapters, or
  runtime services.

## AppTheme Decision

`AppTheme` remains in Knight1y until the other apps are surveyed and a shared
theme builder contract exists.

Future target:

- Keep <ENV_VAR> in `rk_branding`.
- Put reusable theme construction helpers in `rk_ui` if they become cross-app.
- Keep concrete app shell themes in each app unless they become genuinely shared.
