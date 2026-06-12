# App Icon Branding System

Date: 2026-05-30

## Purpose

Rand0m is live at `rand0m.ai`, and the current icon artwork now exists in a
temporary root `favicons/` staging area plus app-local generated platform icon
outputs. This plan defines a reusable shared app icon catalog and picker without
moving assets or releasing package updates yet.

The first implementation target is in-app brand/icon selection. Native launcher
icons remain build-time assets unless a later platform-specific feature uses
alternate icon APIs where supported.

## Current App-Local Status

As of P15.1, Rand0m keeps App Info customization app-local. The runtime owns:

- the in-app icon picker and selected icon Hive setting
- optional custom app bar logo PNG and light/dark HEX app bar colors
- optional Vibe Spotify playlist URLs
- optional Relax YouTube video URLs
- optional About MP4 override
- optional Utility Test flipcard PNGs

These settings are local-only and stored through the app `settings` Hive box.
Uploaded media is not synced, not committed, and not treated as package assets.
Unknown or invalid values must fall back to shipped defaults.

This does not change native launcher icons, PWA install icons, web manifest
icons, Firebase identifiers, package identifiers, or canonical brand IDs.

## Current Asset Inventory

Root staging folder:

| Folder | Source icons | Generated web favicon set |
| --- | --- | --- |
| `favicons/k` | `0k.png`, `k0.png` | yes |
| `favicons/r` | `0r.png`, `r0.png` | yes |
| `favicons/u` | `0u.png`, `u0.png` | yes |
| `favicons/o` | `0o.png`, `o0.png` | yes |
| `favicons/xyz` | `xyz.png`, `zyx.png` | yes |

Meaning:

- `0k`, `0r`, `0u`, `0o`, and `xyz` are primary variants.
- `k0`, `r0`, `u0`, `o0`, and `zyx` are inverse or rounded-square variants.
- The generated favicon sets include `android-chrome-*`, `apple-touch-icon`,
  `favicon-16x16`, `favicon-32x32`, and `favicon.ico`.

Current Rand0m app-local assets include:

- `apps/rand0m/assets/0r.png`
- `apps/rand0m/assets/r0.png`
- `apps/rand0m/assets/0k.png`
- `apps/rand0m/assets/0u.png`
- generated platform launcher icon outputs under `android/`, `ios/`, `macos/`,
  `windows/`, and `web/`

The app's `flutter_launcher_icons` config currently uses `assets/0r.png` as the
build-time launcher icon source.

## Canonical Naming

Use brand-first semantic IDs in shared contracts, with source filename retained
only as metadata.

| Catalog ID | Display name | Current primary source | Current inverse source | Notes |
| --- | --- | --- | --- | --- |
| `rand0m` | Rand0m | `0r.png` | `r0.png` | Active product mark |
| `knight1y` | knight1y | `0k.png` | `k0.png` | Keep as runtime/agent-era brand mark if still useful |
| `up10ad` | up10ad | `0u.png` | `u0.png` | Historical/support mark |
| `out1ine` | out1ine | `0o.png` | `o0.png` | Historical/support mark; current Rand0m icon source came from this artwork |
| `xyz` | Random Knights, XYZ | `xyz.png` | `zyx.png` | Umbrella/repo identity mark |

Do not rename technical identifiers such as the Dart package `rand0m`, Firebase
target `rand0m`, Firebase web app `<PROJECT_ID>`, Hosting site `ai-rand0m`, or
domain `rand0m.ai`.

## rk_branding Ownership

`rk_branding` should own the icon catalog because these marks are brand assets,
not app state or UI behavior.

Proposed asset layout:

```text
packages/rk_branding/assets/icons/
|-- rand0m/
|   |-- primary.png
|   `-- inverse.png
|-- knight1y/
|   |-- primary.png
|   `-- inverse.png
|-- up10ad/
|   |-- primary.png
|   `-- inverse.png
|-- out1ine/
|   |-- primary.png
|   `-- inverse.png
`-- xyz/
    |-- primary.png
    `-- inverse.png
```

Proposed contracts:

```dart
enum AppIconId {
  rand0m,
  knight1y,
  up10ad,
  out1ine,
  xyz,
}

enum AppIconVariant {
  primary,
  inverse,
}

class AppIconDefinition {
  const AppIconDefinition({
    required this.id,
    required this.displayName,
    required this.primaryAssetPath,
    required this.inverseAssetPath,
    this.description,
    this.tags = const [],
    this.isActive = true,
    this.isHistorical = false,
  });

  final AppIconId id;
  final String displayName;
  final String primaryAssetPath;
  final String inverseAssetPath;
  final String? description;
  final List<String> tags;
  final bool isActive;
  final bool isHistorical;
}

abstract final class AppIconCatalog {
  static const List<AppIconDefinition> icons = [
    // shared definitions
  ];

  static AppIconDefinition byId(AppIconId id) => // lookup
}
```

Recommended metadata:

- `displayName`
- `description`
- `primaryAssetPath`
- `inverseAssetPath`
- `sourceFilename`
- `brandFamily`
- `isActive`
- `isHistorical`
- `tags`
- optional `recommendedBackgroundColor`
- optional `contrastNotes`

`rk_branding/pubspec.yaml` must expose the asset folder once the assets move.

## rk_ui Picker Components

`rk_ui` should own reusable presentation and interaction components. It should
depend on `rk_branding` for catalog definitions instead of duplicating icon
metadata.

Proposed components:

- `AppIconPreview`
  - renders one `AppIconDefinition`
  - supports `primary` / `inverse`
  - supports selected, disabled, compact, and large states
- `AppIconPicker`
  - grid/list picker over catalog definitions
  - emits selected `AppIconId`
  - supports filtering historical marks out by default
- `AppInfoIconSection`
  - app-info ready section with current icon, picker entry point, and platform
    limitation copy supplied by the host app if visible help text is desired

Design notes:

- Use a simple grid for visual scanning.
- Keep the selector scoped to in-app brand mark selection.
- Do not imply that selecting an icon changes the OS launcher icon.
- The component should accept `selectedId`, `onSelected`, and an optional
  `enabled` flag so apps can ship the UI behind a feature flag first.

## Persistence

Initial persistence should be local-only:

- Store selected `AppIconId` as a simple string setting.
- Use the existing app-owned Hive/settings pattern if available.
- Default to `AppIconId.rand0m`.
- If the saved ID is missing or unavailable, fall back to `rand0m`.

Future sync:

- Firestore user profile setting can be added later if cross-device preference
  sync is useful.
- Firestore should store only the catalog ID, not asset paths.
- App startup should tolerate stale or unknown IDs from older clients.

## Rand0m Integration

Initial integration in `apps/rand0m`:

- App Info section displays the current selected in-app brand icon.
- User can select among catalog entries if the feature is enabled.
- Selection affects in-app UI surfaces such as avatar, app info mark, drawer
  header mark, or command-center brand mark.
- Native launcher icons, PWA install icons, and favicons remain generated at
  build time from the selected canonical build icon.

Do not change:

- package identity `rand0m`
- Firebase target/app/site names
- `rand0m.ai`
- system-agent names
- standalone package names

## Platform Limits

| Surface | Dynamic at runtime? | Notes |
| --- | --- | --- |
| In-app brand mark | yes | Primary CL implementation target |
| Drawer/header/avatar icon | yes | Safe with local app state |
| Web favicon after load | possible | Can be changed with DOM updates, but PWA install icons still come from manifest |
| Web manifest icons | build/deploy-time | Browser/install behavior depends on cached manifest |
| Android launcher icon | build-time | Runtime changes need platform-specific shortcuts or launcher alias work |
| iOS launcher icon | limited | Alternate icons require native iOS configuration and user-visible system behavior |
| macOS icon | build-time | App bundle icon is packaged |
| Windows icon | build-time | Executable/resource icon is packaged |

The first implementation should not promise native launcher icon mutation.

## Implementation Phases

### Phase A: rk_branding Catalog

- Move approved source PNGs into `rk_branding` asset layout.
- Add `AppIconId`, `AppIconVariant`, `AppIconDefinition`, and
  `AppIconCatalog`.
- Add catalog tests for ID lookup and default icon behavior.
- Validate `rk_branding`.

### Phase B: rk_branding Release

- Version `rk_branding` to `v0.1.1`.
- Tag and push `rk_branding`.
- Do not update app consumers until the tag is available.

### Phase C: rk_ui Picker

- Add `AppIconPreview`, `AppIconPicker`, and `AppInfoIconSection`.
- Keep components passive and app-state driven.
- Validate `rk_ui`.
- Version, tag, and push `rk_ui` as `v0.1.1`.

### Phase D: Rand0m Dependency Update

- Update `apps/rand0m` to consume `rk_branding` and `rk_ui` `v0.1.1`.
- Confirm no local package paths or dependency overrides remain.
- Validate the app.

### Phase E: App Info Picker Integration

- Add a local setting for selected in-app icon ID.
- Show current icon in App Info.
- Add picker UI behind a safe feature flag if needed.
- Apply the selected icon to in-app brand surfaces only.
- Validate and deploy.

### Phase F: Native Alternate Icon Evaluation

- Research iOS alternate icons, Android launcher aliases/shortcuts, and desktop
  constraints.
- Decide whether native alternate icon support is worth the maintenance cost.
- Keep this separate from the initial in-app picker release.

## Risks

- Asset paths in package assets must be stable before releasing `rk_branding`.
- Git dependency tags must be updated in order: `rk_branding` before `rk_ui`,
  then `apps/rand0m`.
- Native launcher icon expectations can easily be misunderstood; UI copy and
  docs must be clear that the picker changes in-app branding first.
- Historical marks may confuse users if exposed publicly too early; filter them
  or label them clearly.
- Web manifest icon cache can make icon changes appear delayed after deploy.

## Open Decisions

- Should `knight1y`, `up10ad`, and `out1ine` be visible choices or hidden
  historical entries?
- Should `xyz` be available as an umbrella app mark in the picker?
- Should the picker live in App Info only, or also in a future settings page?
- Should selected icon preference be per-device only, or eventually synced?

## Recommended Next Step

Keep the current App Info customization layer app-local until the settings and
asset contracts stabilize. Revisit `rk_branding` / `rk_ui` extraction only when
multiple apps need the same catalog, picker, and validation behavior.
