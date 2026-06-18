# Earth Fast Validation Cycle

This lesson teaches how a targeted validation cycle works — analyze, test a
specific scope, then build — using the actual `validate-earth-fast.ps1` script
from the Random Knights toolchain as the teaching example.

The Earth Fast Cycle is the routine a developer runs before opening a pull
request on Earth-related changes. It is faster than a full workspace validation
because it targets only the Earth/Connect test scope instead of the entire
test suite.

## Learning Goals

- Understand why a fast cycle exists alongside a full validation cycle.
- Learn what `flutter test <path>` does compared to `flutter test` (all tests).
- Understand `flutter build web` and why it is part of the cycle.
- Learn the `--no-wasm-dry-run` flag and why it exists.
- Recognize the safe directory-guard pattern for workspace scripts.
- Practice reading script output to diagnose failures.

## Why a fast cycle?

A full workspace validation (`validate-all.ps1`) runs pub get, analysis, and
package analysis across every project. That can take several minutes. When you
are only changing Earth-related Dart files, running the entire suite for every
iteration is slow.

The fast cycle runs three steps scoped to the changes:

1. **`flutter analyze`** — catches type errors and lint violations immediately.
2. **`flutter test test\connect`** — runs the Earth and Connect integration tests
   only, not the full test suite.
3. **`flutter build web`** — confirms the change compiles to a deployable bundle.

All three must pass before a PR opens.

## The script structure

```powershell
# validate-earth-fast.ps1 (teaching excerpt)

param(
    [string] $AppPath,      # optional: override the default app path
    [string[]] $TestPaths   # optional: run specific test files instead of test\connect
)

$ErrorActionPreference = 'Stop'
$WorkspaceRoot = 'C:\Projects\dev-kitt'
$Flutter = Join-Path $WorkspaceRoot 'flutter\bin\flutter.bat'

# Default: apps\rand0m; worktree agents pass their own path
if ([string]::IsNullOrWhiteSpace($AppPath)) {
    $AppRoot = Join-Path $WorkspaceRoot 'apps\rand0m'
    $RequireWorkspaceRoot = $true
}
else {
    $AppRoot = [System.IO.Path]::GetFullPath($AppPath)
    $RequireWorkspaceRoot = $false
}
```

Key design decisions:

- **`$AppPath` parameter** — makes the script reusable across worktrees. A worktree
  agent passes its own checkout path instead of the default.
- **`$RequireWorkspaceRoot`** — the workspace-root guard (below) only fires when
  the caller uses the default path, since worktrees are elsewhere by definition.

## The workspace-root guard

```powershell
function Assert-WorkspaceRoot {
    $Current = [System.IO.Path]::GetFullPath((Get-Location).ProviderPath)
    $Expected = [System.IO.Path]::GetFullPath($WorkspaceRoot)
    if (-not ($Current.Equals($Expected, [System.StringComparison]::OrdinalIgnoreCase))) {
        throw "Run Earth Fast Cycle from workspace root: $WorkspaceRoot"
    }
}
```

This guard checks that the caller is in the right directory before any work
begins. If you accidentally run the script from your home directory or a
different project, it fails loudly instead of silently operating on the wrong
files.

**Why does this matter?** Scripts that take relative paths can silently run on
the wrong project if invoked from the wrong directory. A guard like this catches
the mistake before any damage is done.

## Running targeted tests

```powershell
if ($TestPaths -and $TestPaths.Count -gt 0) {
    & $Flutter test @TestPaths
}
else {
    & $Flutter test test\connect
}
```

`flutter test test\connect` runs every test file under `test\connect\` rather
than the full `test\` tree. This is roughly 10–50× faster depending on how many
tests exist outside that directory.

`flutter test test\connect\source_intake_test.dart` would run a single file —
useful when you are iterating on one failing test.

## The `--no-wasm-dry-run` flag

```powershell
& $Flutter build web --no-wasm-dry-run
```

By default, `flutter build web` on recent Flutter versions runs a Wasm dry run
and prints a notice to stderr:

```
Wasm dry run succeeded. Falling back to JavaScript output.
```

Under Windows PowerShell 5.1 with `$ErrorActionPreference = 'Stop'`, any output
to stderr from a native executable is treated as an error and terminates the
script — even though the build succeeded. `--no-wasm-dry-run` suppresses the
notice so the build completes without false failures.

This is an example of a real platform quirk that required a workaround. The fix
was discovered through a failing CI run, not guesswork.

## The step runner pattern

```powershell
function Invoke-EarthFastStep {
    param([string] $Name, [scriptblock] $Action)
    Write-Host "==> $Name"
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}
```

Wrapping each step in a named function:
- Labels output clearly so you can immediately see which step failed.
- Checks `$LASTEXITCODE` after every native command (PowerShell does not do this
  automatically).
- Throws a readable message instead of silently continuing.

## Safe local workflow

1. Identify a single Dart file you want to change.
2. Make the change.
3. Run `flutter analyze` from the app directory.
4. Run `flutter test test\<your-scope>` to verify the targeted tests pass.
5. Run `flutter build web --no-wasm-dry-run` to confirm the build completes.
6. If all three pass, you are ready to open a PR.

## App Boundary

Keep in the classroom:

- `validate-earth-fast.ps1` as a reference for reading and study.
- The step-runner pattern — apply it to any multi-step script you write.
- The workspace-root guard pattern — copy it into scripts that depend on directory.

Keep in production (do not bring into classroom exercises):

- The actual `test\connect` test suite — those are integration tests against live contracts.
- `flutter build web` output — the build artifacts are not classroom deliverables.
- Workspace paths (`C:\Projects\dev-kitt\...`) — use generic paths in your own scripts.
