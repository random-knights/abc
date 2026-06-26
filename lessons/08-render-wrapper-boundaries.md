# Lesson 08: Render Wrapper Boundaries

## Goal

Understand how a render wrapper script can teach command construction while
remaining outside production app runtime.

## Concepts

- command preview
- FFmpeg dependency
- output naming
- generated artifacts
- production boundary

## Setup

Use this asset:

- `assets/batch/REND3R.bat`

FFmpeg is required locally for render exercises. It is not included in this
repo. Install it from the official FFmpeg download page:

```text
https://ffmpeg.org/download.html
```

## Steps

1. Find where `REND3R.bat` expects FFmpeg to live.
2. Find where it chooses audio inputs.
3. Find how it names output files.
4. Identify what generated output type should not be committed.
5. Explain why this remains classroom-only.

## Challenge

Design a safer wrapper plan that uses a local `workspace/` folder instead of a
hard-coded tool path.

## Expected Outcome

You can explain the difference between a classroom wrapper and a supported
production rendering feature.

## Cleanup / Reset

Delete generated videos from local workspaces. Do not commit FFmpeg binaries or
render outputs.
