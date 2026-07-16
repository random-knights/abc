# RUNBOOK - abc / c1assr00m (human operator)

For agent rules see `CODEX.md`. This is for a human with a terminal.

abc is the public learning environment behind
[c1assr00m.rand0m.ai](https://c1assr00m.rand0m.ai): lessons, labs, missions.
It is Markdown. There is no build, no toolchain, and no secret.

## Quick start

There is nothing to install.

```powershell
cd C:\rand0m\abc
# read the mission folders in order
```

Lessons live in `lessons/`, labs in `labs/`. The numbered `01..10` pairs are the
guided path; each lesson has a matching lab.

## How to deploy

**Nothing here deploys.** The content is the artifact. Merging to `main` is
"shipping" for this repo, and CI only checks that the required files exist and
are non-empty.

If the hosted site at c1assr00m.rand0m.ai is stale or wrong, that is a hosting
question for the app/site side, not this repo.

## How to roll back

Open a revert PR. Never force-push `main`; the org ruleset blocks
non-fast-forward and deletion on the default branch.

Content mistakes here are cheap: nothing is deployed, nothing is versioned by
tag, no consumer pins anything.

## Where secrets live

**Nowhere, and it must stay that way.** This repo is PUBLIC and linked from the
org profile. No workflow takes a secret.

If a lesson seems to need an API key to complete, rewrite the lesson to use a
keyless or mocked path. Do not add a secret to teach with.

Org-wide: live keys are owner-laptop only at `C:\rand0m\.secrets\`. Never commit
or print one.

## What breaks and how to fix it

| Symptom | Cause | Fix |
|---|---|---|
| CI fails on `test -s lessons/NN-*.md` | a lesson or lab file was moved, renamed, emptied, or deleted | Restore it. This is exactly the failure the gate exists to catch - a student would otherwise hit a dead module. |
| CI fails after adding a module | the checker asserts the numbered 01..10 lesson/lab PAIRS | Add both halves: a lesson AND its matching lab. |
| Images do not render | assets are referenced from the `.github` repo by raw URL | Check the path against the `.github` repo; a moved asset breaks silently here. |
| A change to the workflow does not trigger CI | the `paths:` filters self-reference the workflow filename | Keep `.github/workflows/ci.yml` listed in both the `pull_request` and `push` paths blocks. |

## Escalation

The app is `xyz`. Ecosystem docs, ADRs, and runbooks live in `xyz-docs`
(`INDEX.md`). Questions and requests: the public queue in
[123](https://github.com/random-knights/123/issues).
