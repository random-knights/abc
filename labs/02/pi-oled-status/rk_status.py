# Random Knights screens for the 128x32 SSD1306 OLED on the Pi Zero W.
# Reads two files the laptop collector pushes into ~/rk on the Pi:
#   status.json  AiEDs company totals and GitHub Actions cost (every 15 min)
#   pc.json      the laptop's free space and CPU, memory, I/O, GPU use (every minute)
# Shows only what the files hold. A tile with ok=false is skipped. A file that is
# missing or too old gets one plain "stale" page and its numbers are hidden.
# Preview on any machine: python rk_status.py --png out.png [dir with the json files]
import json
import os
import random
import sys
import time
from datetime import datetime, timezone

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.expanduser("~/rk")
W, H = 128, 32
PAGE_SEC = 6
STATUS_STALE_MIN = 45
PC_STALE_MIN = 5


def _font(name, size):
    for d in (os.path.expanduser("~/.fonts"), HERE):
        p = os.path.join(d, name)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


FONT = _font("slkscr.ttf", 8)
BOLD = _font("slkscrb.ttf", 8)
BIG = _font("slkscrb.ttf", 16)


def _parse(ts):
    if len(ts) == 10:
        ts += "T00:00:00Z"
    return datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)


def _stamp(ts, short=False):
    if len(ts) == 10:
        return _parse(ts).strftime("%b %d")
    return _parse(ts).astimezone().strftime("%H:%M" if short else "%b %d %H:%M")


def _load(name, stale_min, data_dir):
    """Returns (doc, state); state is 'ok', 'missing' or 'stale'."""
    try:
        with open(os.path.join(data_dir, name)) as f:
            doc = json.load(f)
        age = (datetime.now(timezone.utc) - _parse(doc["generatedAt"])).total_seconds() / 60
    except Exception:
        return None, "missing"
    return doc, ("stale" if age > stale_min else "ok")


def _t(d, xy, s, font, fill=255):
    """Silkscreen glyphs sit 2 px low at size 8 and 4 px low at 16; lift them so 4 rows fit in 32 px."""
    d.text((xy[0], xy[1] - (3 if font is BIG else 1)), s, font=font, fill=fill)


def _new():
    im = Image.new("1", (W, H))
    return im, ImageDraw.Draw(im)


def _text_page(lines, bold_first=True):
    im, d = _new()
    for i, line in enumerate(lines[:4]):
        _t(d, (0, i * 8), line, font=BOLD if (i == 0 and bold_first) else FONT, fill=255)
    return im


def _rows(d, rows, y0=8):
    """Label on the left, value right-aligned, one row per 8 px."""
    for i, (label, value) in enumerate(rows):
        y = y0 + i * 8
        _t(d, (0, y), label, font=FONT, fill=255)
        _t(d, (W - d.textlength(value, font=FONT), y), value, font=FONT, fill=255)


# ---------------------------------------------------------------- pages
def logo_frames():
    """Crown-RK mark slides in, then the name is typed out."""
    try:
        logo = Image.open(os.path.join(HERE, "rk_logo.png")).convert("1")
    except Exception:
        logo = None
    words = ("RANDOM", "KNIGHTS")
    x_end = 0
    if logo:
        for x in range(-32, x_end + 1, 4):
            im, d = _new()
            im.paste(logo, (x, 0))
            yield im, 0.03
    total = sum(len(w) for w in words)
    for n in range(1, total + 1):
        im, d = _new()
        if logo:
            im.paste(logo, (x_end, 0))
        left = n
        for row, w in enumerate(words):
            part = w[:max(0, min(len(w), left))]
            left -= len(w)
            _t(d, (36, row * 16), part, font=BIG, fill=255)
        yield im, 0.06
    yield im, 2.5


def _val(a, k):
    """'~7 MWh' from a display field. Raises if the field or its value is missing."""
    f = a[k]
    if not f.get("value"):
        raise KeyError(k)
    return "~%s %s" % (f["value"], f.get("unit", ""))


def aieds_totals_page(a):
    im, d = _new()
    _t(d, (0, 0), "AiEDs COMPANY TOTAL", font=BOLD, fill=255)
    _rows(d, [("TOKENS", _val(a, "tokens")), ("ENERGY", _val(a, "energy")), ("CARBON", _val(a, "carbon"))])
    yield im, PAGE_SEC


def aieds_water_page(a):
    im, d = _new()
    w = a["water"]
    _rows(d, [("WATER", _val(a, "water")), ("RANGE", "%s-%s" % (w["low"], w["high"])),
              ("TREE-TIME", _val(a, "treeTime")), ("MODELED", "as of " + _stamp(a["asOf"][:10]))], y0=0)
    yield im, PAGE_SEC


def cost_page(k):
    im, d = _new()
    _t(d, (0, 0), "ACTIONS " + _parse(k["month"] + "-01").strftime("%b").upper(), font=BOLD, fill=255)
    right = "$%.2f" % k["netUsd"]
    _t(d, (W - d.textlength(right, font=BOLD), 0), right, font=BOLD, fill=255)
    _t(d, (0, 8), "%d MIN" % k["minutes"], font=FONT, fill=255)
    asof = _stamp(k["asOf"])
    _t(d, (W - d.textlength(asof, font=FONT), 8), asof, font=FONT, fill=255)
    daily = k.get("dailyMinutes") or []
    if daily and max(daily) > 0:  # one bar per day of the month so far, real minutes
        top = max(daily)
        for i, m in enumerate(daily[:31]):
            h = max(1, int(round(13.0 * m / top))) if m else 0
            if h:
                d.rectangle((i * 4, H - h, i * 4 + 2, H - 1), fill=255)
    yield im, PAGE_SEC


def pc_page(p):
    im, d = _new()
    _t(d, (0, 0), "PC FREE", font=BOLD, fill=255)
    free = " ".join("%s %dGB" % (k, v) for k, v in list(p["freeGb"].items())[:2])
    _t(d, (W - d.textlength(free, font=FONT), 0), free, font=FONT, fill=255)
    for i, (label, key) in enumerate((("CPU%", "cpuPct"), ("MEM%", "memPct"), ("I/O%", "ioPct"), ("GPU%", "gpuPct"))):
        col, row = i % 2, i // 2
        x, y = col * 65, 9 + row * 8
        _t(d, (x, y), label, font=FONT, fill=255)
        d.rectangle((x + 26, y + 1, x + 42, y + 5), outline=255)
        fill = int(round(16 * p[key] / 100.0))
        if fill:
            d.rectangle((x + 26, y + 1, x + 26 + fill, y + 5), fill=255)
        _t(d, (x + 45, y), "%d" % p[key], font=FONT, fill=255)
    asof = "as of " + _stamp(p["asOf"], short=True)
    _t(d, (W - d.textlength(asof, font=FONT), 24), asof, font=FONT, fill=255)
    yield im, PAGE_SEC


KNIGHT = ("...##...",
          "..####..",
          ".##.###.",
          ".######.",
          "...####.",
          "..####..",
          ".######.",
          ".######.")


def knight_frames(hops=26):
    """A chess knight takes a random walk in L-moves on a 16x4 board and leaves a trail."""
    sprite = Image.new("1", (8, 8))
    for y, row in enumerate(KNIGHT):
        for x, c in enumerate(row):
            if c == "#":
                sprite.putpixel((x, y), 1)
    moves = [(1, 2), (2, 1), (-1, 2), (-2, 1), (1, -2), (2, -1), (-1, -2), (-2, -1)]
    pos = (random.randrange(16), random.randrange(4))
    seen = [pos]
    for _ in range(hops):
        im, d = _new()
        for (cx, cy) in seen[:-1]:
            d.rectangle((cx * 8 + 3, cy * 8 + 3, cx * 8 + 4, cy * 8 + 4), fill=255)
        im.paste(sprite, (pos[0] * 8, pos[1] * 8))
        yield im, 0.16
        nxt = [(pos[0] + dx, pos[1] + dy) for dx, dy in moves]
        nxt = [q for q in nxt if 0 <= q[0] < 16 and 0 <= q[1] < 4]
        fresh = [q for q in nxt if q not in seen]
        pos = random.choice(fresh or nxt)
        seen.append(pos)


def ruok_frames():
    """The R, U, O, K brand tiles pop in one by one, then hold."""
    try:
        tiles = [Image.open(os.path.join(HERE, "rk_ruok_%d.png" % i)).convert("1") for i in range(4)]
    except Exception:
        return
    base = Image.new("1", (W, H))
    for i, tile in enumerate(tiles):
        for size in (10, 20, 36, 32):  # grow, overshoot a little, settle
            im = base.copy()
            t = tile.resize((size, size), Image.NEAREST)
            im.paste(t, (i * 32 + (32 - size) // 2, (32 - size) // 2))
            yield im, 0.05
        base.paste(tile, (i * 32, 0))
        yield base.copy(), 0.35
    yield base.copy(), 3.5


def _safe(page, *args):
    """Builds every frame of one page before showing any. A page whose data is
    missing or malformed is skipped whole, so one bad field never shows half a
    page or stops the loop."""
    try:
        return list(page(*args))
    except Exception as e:  # noqa: BLE001 - any bad field skips this page only
        sys.stderr.write("rk_status: skipped %s: %r\n" % (page.__name__, e))
        return []


def _tile(doc, name):
    t = doc.get("tiles") if isinstance(doc, dict) else None
    t = t.get(name) if isinstance(t, dict) else None
    return t if isinstance(t, dict) and t.get("ok") else None


def frames(data_dir=DATA):
    """Yields (image, seconds) for one full loop."""
    pages = [(logo_frames,)]
    doc, state = _load("status.json", STATUS_STALE_MIN, data_dir)
    if state == "missing":
        pages.append((_text_page, ["RANDOM KNIGHTS", "no status file", "nothing from laptop"]))
    elif state == "stale":
        pages.append((lambda: [(_text_page(["RANDOM KNIGHTS", "STALE, last update:",
                                            _stamp(doc["generatedAt"]), "numbers hidden"]), PAGE_SEC)],))
    else:
        a = _tile(doc, "aieds")
        if a:
            pages += [(aieds_totals_page, a), (aieds_water_page, a)]
        k = _tile(doc, "actionsCost")
        if k:
            pages.append((cost_page, k))
    pdoc, pstate = _load("pc.json", PC_STALE_MIN, data_dir)
    p = pdoc.get("pc") if isinstance(pdoc, dict) else None
    if pstate == "ok" and isinstance(p, dict) and p.get("ok"):
        pages.append((pc_page, p))
    elif pstate == "stale":
        pages.append((lambda: [(_text_page(["PC", "no update since", _stamp(pdoc["generatedAt"]),
                                            "laptop asleep or off"]), PAGE_SEC)],))
    pages += [(knight_frames,), (ruok_frames,)]
    for page in pages:
        fn, args = page[0], page[1:]
        if fn is _text_page:
            yield _text_page(*args), PAGE_SEC
            continue
        for f in _safe(fn, *args):
            yield f


def display_rk_info():
    from board import SCL, SDA
    import busio
    import adafruit_ssd1306
    disp = adafruit_ssd1306.SSD1306_I2C(W, H, busio.I2C(SCL, SDA))
    for im, sec in frames():
        disp.image(im)
        disp.show()
        time.sleep(sec)


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--png":
        shots = [im for im, sec in frames(sys.argv[3] if len(sys.argv) > 3 else HERE)]
        keep = [im for im, sec in frames(sys.argv[3] if len(sys.argv) > 3 else HERE) if sec >= 1] + shots[4:5] + shots[-12:-11]
        sheet = Image.new("L", (W * 4 + 8, (H * 4 + 8) * len(keep)), 90)
        for i, im in enumerate(keep):
            sheet.paste(im.convert("L").resize((W * 4, H * 4), Image.NEAREST), (4, 4 + i * (H * 4 + 8)))
        sheet.save(sys.argv[2])
        print("%d frames in a loop, %d on the sheet" % (len(shots), len(keep)))
    else:
        while True:
            display_rk_info()
