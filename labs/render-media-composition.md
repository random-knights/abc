# Lab: Render / Media Composition

This lab is the first c1assr00m media composition exercise. It rebuilds the
retired Rand0m Render preview as a safe local learning workflow.

## Setup

Create a local lab folder:

```text
labs/render-media-composition/workspace/
  input/
  output/
```

Copy or provide classroom-safe sample files:

```text
input/sample-video.mp4
input/sample-audio.mp3
```

Do not use private user files or production secrets.

## Exercise 1: Build The Command

Start with this command shape:

```powershell
ffmpeg -stream_loop -1 -i input/sample-video.mp4 -stream_loop -1 -i input/sample-audio.mp3 -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -t 8 -movflags +faststart output/rand0m-render-preview.mp4
```

Expected result:

- an MP4 file in `output/`
- video from `sample-video.mp4`
- audio from `sample-audio.mp3`
- duration near eight seconds

## Exercise 2: Change Duration

Change `-t 8` to `-t 12`.

Expected result:

- output duration near twelve seconds
- same selected input streams
- no source files modified

## Exercise 3: Sanitize Output Names

Practice safe output naming:

| Input name | Safe output base |
| ---------- | ---------------- |
| `hello render!.mp4` | `hello-render` |
| `rand0m preview` | `rand0m-preview` |
| `../escape` | reject |
| `folder\escape` | reject |

Expected result:

- output names contain only letters, numbers, `_`, and `-`
- path traversal is rejected
- empty names fall back to `rand0m-render-preview`

## Exercise 4: REND3R.bat Wrapper

Draft a local wrapper that:

1. checks for `ffmpeg`
2. creates `output`
3. echoes the command
4. asks for confirmation
5. writes only to `output`

Example discussion skeleton:

```bat
@echo off
where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo ffmpeg was not found on PATH.
  exit /b 1
)

if not exist output mkdir output

echo About to render a classroom preview.
echo Output: output\rand0m-render-preview.mp4
pause
```

## Review Questions

- Why does this lab use local sample files instead of app assets?
- What does `-map 0:v:0` select?
- Why is output path sanitization required?
- Why should production Rand0m not ship a local FFmpeg control surface yet?

## Completion Checklist

- Command is written down before running.
- Output lands in `output/`.
- Source files remain unchanged.
- Unsafe output names are rejected.
- The student can explain the difference between command preview and execution.
