# AGENTS - agent rules for abc (c1assr00m)

Canonical rules live in `C:\rand0m\AGENTS.md` (the working-root standard). This
file restates what an agent MUST follow here and adds the abc specifics. If the
two ever disagree, the working-root standard wins.

abc is **c1assr00m**: a public, student-facing learning environment (lessons,
labs, missions). It is not application code. The app is `xyz`.

## Owner ethos

- The owner approves; agents execute end to end (implement, commit, push, PR,
  green CI). Never fake a green run.
- Credentials are owner-only. Never create, read into chat, print, or commit a
  secret. This repo needs none.
- Reversible cleanup: park or quarantine, never hard-delete.
- ASCII, no em dashes, in committed text.
- Repo changes ship via PR. The default branch is protected by the org ruleset
  `default-branch-protection` (PR required, 0 required reviewers).

## Concurrency - IMPORTANT

At most ONE write-lane per repo at a time. Parallelize ACROSS repos, never
WITHIN one.

Why: every repo under `C:\rand0m` is a fresh clone sharing per-repo git
worktrees. Two write-lanes in one repo has repeatedly caused mid-edit on-disk
file changes, commits tangling onto another agent's branch, and .git metadata
corruption (NUL-padded config/packed-refs, stale index.lock).

- Read-only lanes (audits, discovery, gh status reads) may run alongside
  anything.
- If you hit a shared-worktree conflict mid-task: STOP. Verify `git status` and
  `git diff` contain only YOUR changes and HEAD is on YOUR branch before
  committing.
- `xyz-docs` is the highest-risk repo org-wide; serialize writes to it.

## Toolchain

Lessons 01 through 10 are Markdown-only. Lab 11 is the single labeled
exception: its standalone Python asset demonstrates live provider routing and
trace capture. It is not imported by app code and adds no repo-wide build.
For org context: Flutter 3.38.3 lives at `C:\flutter`; never use `setx` to edit
the USER PATH (it is over the 1024-char setx cap and truncates silently).

## Audience: write for a beginner, in public

This is the one repo whose readers are explicitly NOT engineers. It is public
and it is aimed at students.

- Plain words beat precise jargon. If a term is unavoidable, define it in place.
- Never assume a prior module was read. Say where things are.
- Do not add build tooling, package managers, or a toolchain to "improve" the
  classroom. Lab 11's isolated Python requirements are the only exception.
- Do not put anything secret, private, or internal here. Everything in this repo
  is world-readable, and it is linked from the public org profile.

## Secrets

No workflow here takes a secret. Lab 11 may read `OPENAI_API_KEY` and
`ANTHROPIC_API_KEY` from the local environment only. Keys, `.env` files, and
generated credential material must never be committed.

## Workflow

`.github/workflows/ci.yml` (job: `ABC Classroom Static Checks`) - renamed from
`classroom-validation.yml` on 2026-07-16 to match the org standard.

What it actually does, and why it earns its place: it asserts that every
required lesson and lab file EXISTS and is NON-EMPTY (`test -s`), including the
numbered 01..10 pairs. That is the specific failure this repo has - a lesson or
lab silently going missing or being emptied by a bad move/rename, which a
student would discover instead of CI. It has no failures on record, but it is a
structural gate on public teaching material, not ceremony.

If you rename it again: the `paths:` filters SELF-REFERENCE the workflow
filename in both the `pull_request` and `push` blocks. Miss those and the
workflow stops triggering on its own edits.
