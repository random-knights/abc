# Flutter Dependency Management — `flutter pub get`

This lesson teaches how Flutter resolves and fetches package dependencies across
a multi-project workspace. The example is drawn from the actual Random Knights
`pub-get-all.ps1` tooling script that runs `flutter pub get` across the main app
and all shared packages.

## Learning Goals

- Understand what `flutter pub get` does and why it is necessary.
- Learn the difference between `pubspec.yaml` (source of truth) and `pubspec.lock` (resolved snapshot).
- Recognize what a Flutter workspace looks like when it has multiple projects.
- Practice running `flutter pub get` safely in a local checkout.
- Know which generated files to keep out of version control.

## What `flutter pub get` does

`flutter pub get` reads `pubspec.yaml`, resolves all declared dependencies and
their transitive dependencies, and writes a `pubspec.lock` file and a
`.dart_tool/package_config.json` file.

- `pubspec.yaml` — you write this. It declares which packages you want.
- `pubspec.lock` — Dart writes this. It records the exact resolved versions.
- `.dart_tool/package_config.json` — Dart writes this. It maps package names to
  local cache paths. This file is **machine-local** and should not be committed.

A fresh checkout needs `flutter pub get` before any `flutter analyze`,
`flutter test`, or `flutter build` command will succeed.

## The workspace structure

The Random Knights workspace has one app and several shared packages:

```
dev-kitt/
  apps/
    rand0m/        ← main Flutter app
  packages/
    rk_branding/   ← shared branding package
    rk_ui/         ← shared UI package
    rk_agents/     ← agent foundations
    rk_ai/         ← AI provider contracts
    rk_core/       ← lowest-level shared types
    rk_media/      ← media and sound catalog
    rk_data/       ← data layer contracts
```

Each of these has its own `pubspec.yaml`. Running `flutter pub get` in one does
not affect the others. The tooling script runs it across all of them in sequence.

## The script pattern

```powershell
# pub-get-all.ps1 (teaching excerpt — not for direct use in classroom)

$Flutter = 'C:\Projects\dev-kitt\flutter\bin\flutter.bat'

$Projects = @(
    'C:\Projects\dev-kitt\apps\rand0m',
    'C:\Projects\dev-kitt\packages\rk_core',
    # ... other packages ...
)

foreach ($Project in $Projects) {
    Push-Location -LiteralPath $Project
    try {
        & $Flutter pub get
    }
    finally {
        Pop-Location
    }
}
```

Key patterns to study:

- `Push-Location` / `Pop-Location` — change directory safely; always restore the
  original directory even if the command fails.
- Iterating a list — each project is treated identically; the script does not
  special-case any one package.
- `$ErrorActionPreference = 'Stop'` — the script stops immediately if any step
  fails instead of silently continuing with a broken state.

## Safe local workflow

1. Clone or pull the classroom sample project (not the production workspace).
2. Inspect `pubspec.yaml` to see what packages are declared.
3. Run `flutter pub get` in the project directory.
4. Observe the output — look for "Got dependencies!" or any version conflicts.
5. Check that `.dart_tool/package_config.json` was created.
6. Run `flutter analyze` to confirm the dependency graph is clean.

## App Boundary

Keep in the classroom:

- Sample `pubspec.yaml` files with public packages.
- `pub-get-all.ps1` as a reference pattern for reading.

Keep out of the classroom:

- The actual `dev-kitt` workspace paths or credentials.
- `pubspec.lock` from a production project (it contains resolved private paths).
- `.dart_tool/` — machine-local, always regenerated.

## Common problems

| Problem | Cause | Fix |
| --- | --- | --- |
| "pubspec.yaml not found" | Wrong working directory | Check that you `cd`'d into the project folder |
| Version conflict | Two packages want incompatible versions of a third | Read the conflict message; update one version constraint |
| "Could not resolve SDK constraint" | Flutter version mismatch | Check `flutter --version`; upgrade if needed |
| Stale `.dart_tool/` after a `git pull` | Lock file changed upstream | Re-run `flutter pub get` |
