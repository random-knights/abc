# Random Knights Naming and Domain Map

## Current State

- Current Flutter/Firebase project: `kn1ghts`
- Current app identity: Knight1y / `kn1ghts`
- Current package examples:
  - `ai.rand0m.knight1y`
  - old: `ai.rand0m.kn1ghts`
- Current GitHub org: `random-knights`
- Current domain owner/base: `rand0m.ai`

## Target App Ecosystem

- `rand0m`
- `up10ad`
- `out1ine`
- `knight1y`

## Recommended Public Domains

- `rand0m.ai`
- `up10ad.rand0m.ai`
- `out1ine.rand0m.ai`
- `knight1y.rand0m.ai`

## Recommended Repo Names

- `random-knights/rand0m`
- `random-knights/up10ad`
- `random-knights/out1ine`
- `random-knights/knight1y`

## Recommended App IDs / Bundle IDs

Use a consistent `ai.rand0m.<app>` scheme:

- `ai.rand0m.xyz`
- `ai.rand0m.up10ad`
- `ai.rand0m.out1ine`
- `ai.rand0m.knight1y`

## Firebase Mapping Strategy

Firebase app registrations should be aligned per app and per platform before any rename work begins.

For each target app, map and verify:

- Android package name
- iOS bundle ID
- macOS bundle ID
- Windows app identity
- Web app and Hosting target
- Domain aliases

Firebase app replacements should be created and verified before retiring old registrations. Existing Firebase app IDs, package names, and bundle IDs may need to remain available during transition windows for installed clients, release tracks, or platform store continuity.

## Knight1y Firebase Alignment Plan

- Firebase project remains `kn1ghts` for now.
- Android is already `ai.rand0m.knight1y`.
- iOS should move from `com.example.kittPlus` to `ai.rand0m.knight1y`.
- macOS should move from `com.example.kittPlus` to `ai.rand0m.knight1y`.
- Windows product identity should move from `kitt_plus` to `knight1y`.
- Web should target `knight1y.rand0m.ai`.
- Firebase console apps must be created and verified before local config files are edited.
- `google-services.json`, `GoogleService-Info.plist`, `firebase_options.dart`, `firebase.json`, and `.firebaserc` must be regenerated or updated together after Firebase Console is authoritative.
- Old Firebase app registrations should not be deleted until replacement builds work.

## Rename Rules

- Do not rename code packages before the mapping is approved.
- Do not delete Firebase apps until replacement apps are verified.
- Preserve old package IDs only as compatibility where needed.
- Prefer readable public names over internal leetspeak except `rand0m`, `up10ad`, `out1ine`, and `knight1y`.
- Avoid `kn1ghts` as a public product name going forward unless intentionally retained as an internal project codename.

## Open Questions

- Should the root Firebase project remain `kn1ghts` or move to `<PROJECT_ID>`?
- Should `knight1y` be spelled `knight1y` or `knightly` publicly?
- Should `rand0m.ai` host the core app or a marketing/landing page?
- Should apps live in separate repos or under `apps/*` in one monorepo long-term?
