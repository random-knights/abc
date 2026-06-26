# REND3R — render-media-composition lab

REND3R is the Random Knights ambient-render tool: it loops a video over an audio
bed into a long-form MP4. This is the **classroom edition** — PATH-based and
self-contained, so nothing binary ever lives in the repo.

> Rule of thumb for this lab: **scripts + lessons go in git; binaries + renders do
> not.** The `ffmpeg` executables and your render outputs stay on your machine.

## 1. Install ffmpeg (one time)

The renderer shells out to **ffmpeg** — free, third-party software we deliberately
do *not* commit. Install it once and make sure it's on your PATH:

- **Windows:** `winget install Gyan.FFmpeg`  (or `choco install ffmpeg`)
- **macOS:** `brew install ffmpeg`
- **Linux:** `sudo apt install ffmpeg`
- or download from <https://ffmpeg.org/download.html> and add it to PATH.

Verify with `ffmpeg -version`. `REND3R.bat` also checks for you and stops with an
install hint if ffmpeg isn't found.

## 2. Add classroom-safe sample media

Drop two small, classroom-safe files into `workspace/input/` (that folder is
gitignored, so your media stays local):

```text
workspace/input/sample-video.mp4
workspace/input/sample-audio.mp3
```

Don't use private user files or production assets. Use any short royalty-free clip,
or pull the shared classroom samples from the hosted bucket:
**`https://storage.googleapis.com/randomknights-xyz.firebasestorage.app/c1assr00m/render/`**
_(owner to publish the samples there)._

## 3. Run it

```bat
REND3R.bat
```

It renders `workspace/input/sample-video.mp4` + `sample-audio.mp3` into
`workspace/output/rand0m_render_<timestamp>.mp4`. Edit `TARGET_DURATION` at the top
of the script (seconds — `8` for a quick test, `28800` for the full 8-hour ambient
render).

## 4. Where the big files go (never the repo)

| Artifact | Where it lives |
| --- | --- |
| `ffmpeg.exe` / `ffplay.exe` / `ffprobe.exe` | installed on PATH (step 1) — **gitignored** |
| your `workspace/input` + `output` media | local only — **gitignored** |
| the published **sample output** for the lesson | the GCS bucket above, or a GitHub **Release** asset (≤ 2 GB), linked from `../render-media-composition.md` |

GitHub isn't a binary store — for anything large (the ffmpeg build, a finished
render you want to show), host it in the bucket or attach it to a Release and link
to it. The repo keeps only the script and the lesson.
