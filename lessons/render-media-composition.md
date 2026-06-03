# Render / Media Composition

This lesson preserves the retired Rand0m Render preview as a classroom-first
learning module. Render is no longer part of the production Rand0m app; the
concepts live here so contributors can study local media composition without
shipping FFmpeg orchestration, browser muxing, cloud workers, or file generation
inside the app runtime.

## Learning Goals

- Understand the difference between a command preview and command execution.
- Learn how video and audio streams are selected and combined.
- Practice FFmpeg argument construction with safe local paths.
- Keep shared app assets separate from classroom-only render experiments.
- Explain why production apps should not expose local renderer controls before
  permissions, storage, validation, and support boundaries are approved.

## Original Rand0m Concept

The retired Render preview let a developer choose:

- a short app video loop, such as `dai1y` or `knight1y`
- an ambience sound, such as `fire`, `rain`, or `forest`
- a duration in seconds
- a sanitized output file name

It then displayed a command shape only. It did not execute FFmpeg or generate a
file from the Flutter app.

## FFmpeg Concepts

The classroom command uses two looping inputs:

```text
ffmpeg -stream_loop -1 -i input-video.mp4 -stream_loop -1 -i input-audio.mp3 ...
```

Important flags:

- `-stream_loop -1`: loop the following input indefinitely.
- `-i`: declare an input file.
- `-map 0:v:0`: use the first video stream from input zero.
- `-map 1:a:0`: use the first audio stream from input one.
- `-c:v copy`: copy the video stream without re-encoding.
- `-c:a aac`: encode audio as AAC for MP4 compatibility.
- `-t 8`: stop output after eight seconds.
- `-movflags +faststart`: move MP4 metadata so playback can start quickly.

## Safe Local Workflow

Keep classroom rendering local:

1. Use copied sample assets in a lab workspace.
2. Never point commands at production secrets or user data.
3. Generate output into an ignored `output/` folder.
4. Inspect the command before running it.
5. Verify the output manually before sharing.

## REND3R.bat Discussion

`REND3R.bat` belongs in classroom exercises, not the production Rand0m app. A
batch wrapper is useful for learning because it can:

- check whether `ffmpeg.exe` exists
- create an `output/` folder
- echo the full command before execution
- pause on failure so students can read errors

The wrapper should not become an app runtime dependency. Production rendering
would require a separate approved architecture for permissions, storage,
resource limits, cancellation, error handling, and support.

## App Boundary

Do not move these into Rand0m production:

- FFmpeg binaries
- `REND3R.bat`
- local file writers
- browser-side muxing
- cloud render workers
- Render tabs or preview UI

Keep these in Rand0m production when needed by other features:

- shared Oracle sound assets
- ecosystem sound registry
- Oracle customization and roadmap work
