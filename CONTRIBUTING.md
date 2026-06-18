# Contributing to Random Knights, XYZ — abc

`abc` is the public documentation and classroom workspace for Random Knights, XYZ contributors.

## What lives here

| Folder | Contents |
| --- | --- |
| `apps/_c1assr00m/` | C1assr00m app companion docs |
| `branding/` | Public theme, icon, and brand docs |
| `labs/` | Standalone lab exercises |
| `lessons/` | Classroom lessons — guided, runnable, and sandboxed |

Architecture specs, automation standards, deployment decisions, and roadmap state live in the private org `.github` repo and are not accepted here.

## How to contribute

1. Fork the repo.
2. Create a focused branch: `docs/<short-description>` or `lesson/<lesson-name>`.
3. Make the smallest useful change. One lesson or one doc fix per PR.
4. Open a pull request against `main`. Describe what the lesson teaches or what the doc fix corrects.

PRs land through the `qa-kitt` review path before merge.

## Lesson standards

Lessons in `lessons/` must:

- Teach a real, runnable concept drawn from the actual Random Knights toolchain.
- Include a **Learning Goals** section.
- Include a **Safe Workflow** section — what to do locally, what to keep out of the repo.
- Include an **App Boundary** section — what stays in classroom only vs. what is used in production.
- Use only public-domain or CC0 examples. No secrets, ENV vars, private paths, internal identities, or deployment mechanics.
- Be self-contained — a contributor should be able to follow the lesson from a fresh checkout.

## What to keep out

- Internal operations, deployment details, security posture, private identities.
- `<ENV_VAR>` placeholders referencing real credentials or service accounts.
- Local paths that expose machine or developer identity (`C:\Users\<name>\...`).
- Roadmap state or READLESS roadmap links.
- Architecture decision records (those belong in `.github/READMORE/decisions/`).
- Automation or BDD standards (those belong in `.github/READMORE/automation/`).

If a doc needs internal coordination before it can be made public, keep it in READLESS until ratified.

## Classroom FFmpeg boundary

Render and media labs require FFmpeg installed locally. Install from the official
[FFmpeg download page](https://ffmpeg.org/download.html). Keep FFmpeg on PATH.

Do not commit `ffmpeg.exe`, `ffprobe.exe`, generated videos, or large render outputs.
`REND3R.bat` and related scripts are classroom-only learning materials, not production dependencies.

## Review path

All PRs are reviewed by a `qa-kitt` maintainer. The bar is:

- Accurate — the lesson runs as written on a fresh checkout.
- Safe — no internal info leaks.
- Focused — teaches one concept clearly.
- Linked — references public docs when a deeper concept is out of scope.
