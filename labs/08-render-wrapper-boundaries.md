# Lab 08: Render Wrapper Boundaries

## Goal

Prepare a safe local render workspace while keeping FFmpeg and generated videos
out of git.

## Concepts

- FFmpeg local dependency
- source asset copying
- generated output
- ignored workspace

## Setup

FFmpeg is required locally and is not included in this repo. Install it from:

```text
https://ffmpeg.org/download.html
```

Create:

```text
workspace/render/
  input/
  output/
```

Copy one MP3 from `assets/mp3/` into `workspace/render/input/`.

Provide your own classroom-safe sample video as:

```text
workspace/render/input/sample-video.mp4
```

## Steps

1. Open `assets/batch/REND3R.bat`.
2. Find the FFmpeg command.
3. Rewrite the command on paper using your workspace paths.
4. Confirm the output path is under `workspace/render/output/`.
5. Check `.gitignore` and confirm video outputs are ignored.

## Challenge

Draft a safer wrapper rule: "refuse to write outside output".

## Expected Outcome

You understand how to prepare a local render exercise without committing
FFmpeg, sample videos, or generated output.

## Cleanup / Reset

Delete `workspace/render/` when finished.
