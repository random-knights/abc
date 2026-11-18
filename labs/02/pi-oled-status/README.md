# Lab: a tiny status screen that never lies

A Raspberry Pi Zero W with a thumb-sized screen sits on a desk and shows live
numbers from a laptop: how much energy our AI work used, the laptop's free disk
space, and how busy its processor is. Then a chess knight hops around, just for
fun.

This lab is the real code that runs on that Pi. The big lesson is not the
screen. It is a rule: **a screen should show nothing before it shows a wrong
number.**

## What you need

- A Raspberry Pi Zero W (any Raspberry Pi works) running Raspberry Pi OS Lite.
- A 128x32 pixel OLED screen with an SSD1306 chip, wired to the Pi's I2C pins.
  I2C is a simple two-wire way for small chips to talk to the Pi.
- A Windows laptop on the same Wi-Fi.
- Optional: the free Silkscreen pixel font (`slkscr.ttf`, `slkscrb.ttf`) from
  Google Fonts. Without it the code uses a plain built-in font.

## The two halves

| File | Runs on | Job |
| --- | --- | --- |
| `collect.ps1` | the laptop | Measures real numbers and writes `status.json` and `pc.json`. |
| `rk_status.py` | the Pi | Reads those two files and draws the screens. |

The laptop does all the thinking. The Pi only draws. The Pi holds no password,
no key and no account. If someone took the Pi, they would get two small files of
public numbers.

## Step 1: try it without any hardware

You can see every screen on your own computer first. Install Python and the
Pillow image library, then run the collector and the preview:

```powershell
py -3 -m pip install pillow
powershell -NoProfile -ExecutionPolicy Bypass -File collect.ps1
py -3 rk_status.py --png preview.png .
```

Open `preview.png`. Each band is one screen, drawn four times bigger.

## Step 2: put it on the Pi

On the Pi, install the screen libraries into a virtual environment (a private
folder of Python packages):

```bash
python3 -m venv ~/oled_env
~/oled_env/bin/pip install pillow adafruit-blinka adafruit-circuitpython-ssd1306
mkdir -p ~/rk
```

Copy `rk_status.py` to your home folder on the Pi and run it:

```bash
~/oled_env/bin/python ~/rk_status.py
```

Back on the laptop, send fresh numbers every minute. Replace the address with
your Pi's user and address:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File collect.ps1 -Push -PiHost pi@192.0.2.10
```

`-Push` uses SSH with a key file (`-KeyFile`). Make a key just for this Pi, and
copy only the public half to the Pi.

## How it refuses to lie

Read the code and find each of these guards:

1. **Every tile says where it came from.** The collector writes `ok`, `source`
   and `asOf` (the time the number is true for) on every tile.
2. **A failed read is not a zero.** If the collector cannot read a number, it
   writes `ok: false` and no number at all. The Pi skips that tile.
3. **Old files are hidden.** If `status.json` is older than 45 minutes, the
   screen says "STALE, numbers hidden" instead of showing old numbers as if they
   were new. Look for `STATUS_STALE_MIN`.
4. **A broken field skips one page, not the whole loop.** `_safe()` builds every
   frame of a page before it shows any. If one field is missing, that page is
   skipped and the rest keep running. Look for `_safe` and `_tile`.
5. **The date is always on screen.** The energy page always ends with
   "MODELED as of" and the date, because those numbers are estimates.

## Try this

- Delete `"water"` from `status.json` and run the preview again. Which page
  disappears? Which pages stay?
- Change a time in `status.json` to last week. What does the screen say now?
- Add your own 32x32 black-and-white images named `rk_logo.png` and
  `rk_ruok_0.png` to `rk_ruok_3.png`. The intro and the last screen use them.
  Without them, the intro shows only the name and the last screen is skipped.

## Where the numbers come from

- **AiEDs totals:** the public file at
  `https://storage.googleapis.com/randomknights-xyz.firebasestorage.app/aieds/aieds-totals.json`.
  AiEDs is our standard for showing the energy, carbon and water that AI work
  uses. Every one of those figures is a modeled estimate, not a meter reading.
- **Your PC:** Windows performance counters, read for two seconds.
- **GitHub Actions cost (optional):** add `-GitHubOrg your-org`. This needs the
  `gh` tool signed in as someone who can read that organization's billing.
