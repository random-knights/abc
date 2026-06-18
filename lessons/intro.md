# C1assr00m Introduction

Welcome to the Random Knights C1assr00m — a structured learning space for contributors getting started with software development, AI, automation, and S.T.E.A.M. concepts inside the Random Knights workspace.

## How the classroom works

Lessons live as Markdown files in `lessons/`. Each lesson is:

- **Guided** — there is a clear path to follow.
- **Runnable** — the examples actually work when you follow them.
- **Sandboxed** — classroom exercises stay local and do not touch production systems.

You work through lessons at your own pace. When you finish a lesson, you should be able to explain what it taught without looking at the doc.

## What you will need

Before starting lessons that involve code:

- [Git](https://git-scm.com/downloads) installed and configured.
- A terminal — PowerShell on Windows, Terminal on Mac/Linux.
- [Flutter SDK](https://docs.flutter.dev/get-started/install) installed for Dart/Flutter lessons.
- [FFmpeg](https://ffmpeg.org/download.html) on PATH for media/render lessons.

## Learning path

Start here, then work through the lessons in order:

| # | Lesson | Topic |
| --- | --- | --- |
| 0 | `intro.md` (this file) | Orientation |
| 1 | `render-media-composition.md` | Video + audio composition with FFmpeg |
| 2 | `pub-get-and-deps.md` | Flutter dependency management (`flutter pub get`) |
| 3 | `flutter-analyze.md` | Static analysis across a Flutter workspace |
| 4 | `validate-earth-fast.md` | Earth Fast Cycle — analyze, test, and build |
| 5–11 | _coming soon_ | Git workflows, Firebase basics, agent foundations, AI prompting, test automation, data layers, and more |

## Rules for classroom work

1. Keep experiments local — do not push generated outputs or render files.
2. Do not copy credentials, API keys, or ENV variables into lesson files.
3. Use the sample assets provided in `labs/` — do not use production data.
4. If a command fails, read the error before retrying. Understanding failure is part of the lesson.
5. Ask questions via an issue or pull request — the community learns together.

## What the classroom is not

The C1assr00m is not a place to:

- Deploy to production.
- Access live Firebase projects.
- Run commands that write to shared resources.
- Commit binary outputs, large render files, or tool executables.

When you are ready for those topics, they are covered in the advanced paths that follow on-boarding through the classroom.
