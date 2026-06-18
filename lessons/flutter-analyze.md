# Flutter Static Analysis — `flutter analyze`

This lesson teaches how `flutter analyze` works, why it matters as a CI gate,
and how the Random Knights workspace runs it across every project in sequence.
The example is drawn from the actual `analyze-all.ps1` script used in local
workspace validation.

## Learning Goals

- Understand what `flutter analyze` checks and what it cannot catch.
- Learn why analysis must run after `flutter pub get` (not before).
- Practice reading and fixing analyzer output.
- Understand the `--no-pub` flag and when to use it.
- Know how workspace-level analysis differs from single-project analysis.

## What `flutter analyze` does

`flutter analyze` runs the Dart analyzer across all `.dart` files in a project.
It checks for:

- Type errors — passing the wrong type to a function.
- Unused imports and variables.
- Deprecated API usage.
- Lint rule violations (configured in `analysis_options.yaml`).
- Missing `await` on async calls that return `Future`.

It does **not** run tests. Analysis is a static check — it reads your code
without executing it.

## Why `flutter pub get` must come first

The analyzer needs to resolve imports. If you have not run `flutter pub get`,
the `.dart_tool/package_config.json` file is missing or stale and the analyzer
cannot find your dependencies. You will see errors like:

```
Target of URI doesn't exist: 'package:rk_core/src/ids.dart'
```

Always run `flutter pub get` (or `pub-get-all.ps1`) before running analysis in
a freshly cloned checkout.

## The script pattern

```powershell
# analyze-all.ps1 (teaching excerpt)

$Flutter = 'C:\Projects\dev-kitt\flutter\bin\flutter.bat'

$Projects = @(
    'C:\Projects\dev-kitt\apps\rand0m',
    'C:\Projects\dev-kitt\packages\rk_core',
    # ... other packages ...
)

foreach ($Project in $Projects) {
    Push-Location -LiteralPath $Project
    try {
        & $Flutter analyze
        if ($LASTEXITCODE -ne 0) {
            throw "flutter analyze failed in $Project"
        }
    }
    finally {
        Pop-Location
    }
}
```

The script is identical in structure to `pub-get-all.ps1` — same loop, same
safe `Push-Location` / `Pop-Location` pattern. The only difference is the
command being run.

## The `--no-pub` flag

In `validate-all.ps1`, packages are analyzed with `flutter analyze --no-pub`
after `flutter pub get` has already run. The `--no-pub` flag tells the analyzer
to skip the implicit pub fetch it would otherwise do. This avoids redundant
network activity when the packages are already resolved.

Use `--no-pub` when:

- You have already run `flutter pub get` explicitly.
- You want to confirm the analysis step in isolation without touching the lock file.

Do not use `--no-pub` in a fresh checkout — you will get missing-package errors.

## Reading analyzer output

A clean result looks like:

```
Analyzing apps/rand0m...
No issues found!
```

A result with findings looks like:

```
error • The name 'EarthWindGrid' isn't defined • lib/pages/earth/earth_tab.dart:42:7
hint  • Unused import 'package:rk_ui/widgets.dart' • lib/pages/home.dart:3:1
```

Each line shows:
- **Severity** — `error`, `warning`, `hint`, or `info`.
- **Message** — what is wrong.
- **Location** — `file:line:column`.

Errors block CI. Warnings and hints should be fixed but do not always fail a build
(depending on the project's `analysis_options.yaml` configuration).

## Safe local workflow

1. Clone the classroom sample project.
2. Run `flutter pub get` first.
3. Run `flutter analyze`.
4. Read any findings — pick one, understand why it is flagged, and fix it.
5. Re-run `flutter analyze` to confirm the fix.
6. Optionally, read `analysis_options.yaml` to see which lint rules are enabled.

## App Boundary

Keep in the classroom:

- Sample `.dart` files with intentional analyzer findings for practice.
- `analysis_options.yaml` examples showing different rule sets.
- `analyze-all.ps1` as a reference pattern.

Keep out of the classroom:

- Production `analysis_options.yaml` that references private lint packages.
- Workspace paths from the production `dev-kitt` machine.
