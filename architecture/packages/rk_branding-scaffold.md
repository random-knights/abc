# rk_branding Scaffold

Branding Phase 1A created `packages/rk_branding` as a local Flutter package for
shared-safe Random Knights branding primitives.

## Package Contents

Current structure:

- `packages/rk_branding/pubspec.yaml`
- `packages/rk_branding/lib/rk_branding.dart`
- `packages/rk_branding/lib/src/colors/app_colors.dart`
- `packages/rk_branding/lib/src/fonts/rk_fonts.dart`

Current exports:

- `AppColors`
- `RKFonts`

## Boundary Validation

Branding Phase 1B validated that `rk_branding` contains only branding
primitives.

Current package purity:

- No `kn1ghts` imports.
- No Hive imports or adapters.
- No Firebase imports or generated config.
- No runtime services.
- No widgets, pages, routes, navigation, or app shell logic.
- No dependency on `rk_ui`, `rk_agents`, or `rk_ai`.

Allowed dependencies:

- Flutter, because `Color`, `TextStyle`, `TextTheme`, `Brightness`, and
  `FontWeight` are Flutter UI primitives.
- Google Fonts, because `RKFonts` centralizes shared font construction.

## Dependency Direction

Chosen direction:

- Knight1y depends on `rk_branding`.
- Knight1y depends on `rk_ui`.
- `rk_ui` depends on `rk_branding` for shared color <ENV_VAR>.
- `rk_branding` does not depend on `rk_ui`.
- `rk_agents` and `rk_ai` remain independent of `rk_branding` and `rk_ui`.

This makes `rk_branding` a primitive layer beneath UI widgets and prevents a
branding/UI circular dependency.

Current dependency graph:

- `kn1ghts` -> `rk_branding`
- `kn1ghts` -> `rk_ui`
- `kn1ghts` -> `rk_agents`
- `kn1ghts` -> `rk_ai`
- `rk_ui` -> `rk_branding`
- `rk_branding` -> Flutter, Google Fonts
- `rk_agents` -> Dart only
- `rk_ai` -> Dart only

Circular dependency verdict:

- No package cycle exists between `rk_branding`, `rk_ui`, `rk_agents`, and
  `rk_ai`.
- The key enforced rule is still: `rk_branding` must not import `rk_ui`.

## Behavior Preservation

Typography behavior is unchanged:

- `RKFonts.display()` still uses `GoogleFonts.patrickHand`.
- `RKFonts.terminal()` still aliases display styling.
- Light mode body text still uses `GoogleFonts.mulishTextTheme()`.
- Dark mode body text still uses `GoogleFonts.interTextTheme()`.

Color behavior is unchanged because `AppColors` values were copied exactly from
the previous `rk_ui` source and `rk_ui` now re-exports the branding-owned type.

## AppTheme Ownership

`AppTheme` should remain app-local for now.

Reason:

- `AppTheme` assembles full `ThemeData` for the Knight1y app shell.
- It includes app-specific surface decisions such as scaffold background,
  transparent app bars, icon color defaults, button theme defaults, and system
  overlay style.
- Moving it into `rk_branding` would mix <ENV_VAR> with app theme application.
- Moving it into `rk_ui` is plausible later, but only after cross-app theme
  requirements are compared and a reusable theme builder contract exists.

Recommended future split:

- `rk_branding`: color <ENV_VAR>, font helpers, brand constants, typography <ENV_VAR>.
- `rk_ui`: reusable widgets, progress components, theme builder utilities, and
  shared component-level styling contracts.
- Knight1y app: concrete `ThemeData` assembly, app shell defaults, asset
  decisions, route/page-specific styling, and runtime-owned theme settings.

## Not Moved Yet

The following remain app-local:

- Launcher icons.
- Image, video, audio, and book assets.
- App-specific logo files.
- App route/page/widget styling decisions.
- Theme application in `lib/services/theme.dart`.
- `AppTheme`, until a shared cross-app theme contract exists.
- Runtime services, Hive models, Firebase config, and generated files.

## Future Candidates

Potential future `rk_branding` candidates after cross-app review:

- Shared brand constants.
- Logo path constants, if all apps agree on package asset strategy.
- Theme <ENV_VAR> names that are not app-runtime coupled.
- Shared gradients only if they are true brand primitives rather than local UI
  composition.

Asset files should stay out of `rk_branding` until package asset loading,
launcher icon ownership, and app-specific branding differences are documented.

## Remaining Duplication Scan

Phase 1B scan result:

- `AppColors` is defined only in `packages/rk_branding`.
- `RKFonts` is defined only in `packages/rk_branding`.
- `GoogleFonts.patrickHand` is used only by `RKFonts.display()`.
- `GoogleFonts.mulishTextTheme()` and `GoogleFonts.interTextTheme()` are used
  only by `RKFonts.bodyTextTheme()`.
- `lib/theme/fonts.dart` remains only as a compatibility export bridge.
- `packages/rk_ui/lib/src/theme/app_colors.dart` remains only as a
  compatibility export bridge.

The remaining direct Google Fonts usage in Knight1y is
`GoogleFonts.notoColorEmoji()` for emoji rendering, not branding typography.
