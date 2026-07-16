# Agent rules (abc / c1assr00m)

**Read `../CODEX.md` in this repo root and follow it. It is the authority for
this repo.** Canonical org rules live in `C:\rand0m\CODEX.md`; the repo CODEX
restates them and adds the local specifics. `RUNBOOK.md` is the human guide.

abc is the PUBLIC, student-facing learning environment (lessons and labs). It is
not application code. The app is `xyz`.

The four that bite hardest here:

1. **The audience is a beginner, not an engineer.** Plain words beat precise
   jargon. Define any term you must use. Never assume a prior module was read.
2. **This repo is world-readable** and linked from the public org profile.
   Nothing private, internal, or secret goes here, ever.
3. **Do not add a toolchain.** No build, no package manager, no setup. A student
   needs a browser and a text editor; that is the point, not an omission.
4. **ONE write-lane per repo.** Parallelize across repos, never within one.

CI asserts every required lesson/lab file exists and is non-empty, including the
numbered 01..10 pairs. If you add a module, add BOTH halves. Never fake a green
run. Credentials are owner-only; this repo needs none.
