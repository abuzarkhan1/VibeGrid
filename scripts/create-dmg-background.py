#!/usr/bin/env python3
"""Generate the branded VibeGrid DMG installer background.

The macOS DMG installer is a Finder window with a background image plus two
icons: the app itself and a symlink to /Applications. Tauri v2 exposes all of
it through bundle.macOS.dmg:
  - background:            PNG/JPG/GIF image shown behind the icons
  - windowSize:            logical (point) window size — default 660x400
  - appPosition:           point where the APP icon is placed
  - applicationFolderPosition: point where the /Applications alias is placed

This script renders a dark, on-brand background at 2x the logical window size
(1320x800 for a 660x400 window) so it is retina-sharp, with:
  - a deep navy radial/linear gradient matching the app (#03060a base)
  - a faint dot grid + soft glows (the app's "vibe" motif)
  - the VibeGrid wordmark + 2x2 brand-square glyph at the top
  - two subtle rounded "drop zone" outlines exactly where the icons will sit
  - an arrow hint between the zones and helper copy at the bottom

Usage:
  python3 scripts/create-dmg-background.py [--out path] [--size WxH]

The output should be referenced in tauri.conf.json as
  "bundle": { "macOS": { "dmg": { "background": "icons/dmg-background.png",
                                   "windowSize": { "width": 660, "height": 400 },
                                   "appPosition": { "x": 180, "y": 170 },
                                   "applicationFolderPosition": { "x": 480, "y": 170 } } } }

Requires: Pillow (pip install pillow)
"""

import argparse
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

# Brand palette (matches the app / website)
BG_TOP = (7, 12, 24)         # #070c18
BG_BOTTOM = (3, 6, 10)       # #03060a
BRAND = (60, 149, 240)       # #3c95f0 (accent)
BRAND_DEEP = (36, 127, 243)  # #247ff3
BRAND_SOFT = (46, 96, 160)   # muted blue for glows
WHITE = (255, 255, 255)
TEXT_DIM = (150, 165, 185)   # #96a5b9
ZONE_LINE = (90, 140, 200)   # drop-zone outline
ZONE_FILL = (20, 40, 66)     # drop-zone inner fill

# Logical (point) window size — must match tauri.conf.json dmg.windowSize.
WINDOW_W, WINDOW_H = 660, 400
SCALE = 2  # render at 2x for retina

# Icon drop zones (logical points) — must match dmg.appPosition /
# applicationFolderPosition. The icons themselves are Finder-rendered on top;
# these outlines sit behind them as visual affordances.
APP_ZONE = (180, 170)       # app icon top-left point
FOLDER_ZONE = (480, 170)    # /Applications alias top-left point
ICON_SIZE = 112             # logical px the Finder icon occupies (~112 at 128px/1.16)
ZONE_PAD = 18               # outline padding around the icon


def lerp(a, b, t):
    return a + (b - a) * t


def load_font(size_px, bold=False):
    """Best-effort font loading across macOS/Linux/Windows."""
    candidates = []
    if bold:
        candidates += [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "C:\\Windows\\Fonts\\arialbd.ttf",
        ]
    else:
        candidates += [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "C:\\Windows\\Fonts\\arial.ttf",
        ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size_px)
        except Exception:
            continue
    return ImageFont.load_default()


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def draw_dot_grid(draw, w, h, spacing, radius, color, alpha):
    """Faint grid of dots — the app's 'vibe' motif."""
    for x in range(spacing // 2, w, spacing):
        for y in range(spacing // 2, h, spacing):
            # fade dots toward the bottom for depth
            fade = 1.0 - (y / h) * 0.55
            a = int(alpha * fade)
            if a <= 0:
                continue
            draw.ellipse(
                [x - radius, y - radius, x + radius, y + radius],
                fill=color + (a,),
            )


def radial_glow(draw, w, h, cx, cy, radius, color, max_alpha):
    """Soft radial glow by drawing concentric alpha-faded rings."""
    steps = 40
    for i in range(steps, 0, -1):
        t = i / steps
        r = radius * (1.0 - t)
        a = int(max_alpha * t * t)
        if a <= 0:
            continue
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r], fill=color + (a,)
        )


def draw_zone_outline(draw, top_left, size, label):
    """Rounded-rect outline + soft fill behind a Finder icon drop zone."""
    x, y = top_left
    pad = ZONE_PAD
    r = 22
    box = [x - pad, y - pad, x + size + pad, y + size + pad]
    # inner soft fill
    draw.rounded_rectangle(box, radius=r, fill=ZONE_FILL + (70,))
    # outer glow ring
    for i in range(3, 0, -1):
        w = i * 2
        draw.rounded_rectangle(
            [box[0] - w, box[1] - w, box[2] + w, box[3] + w],
            radius=r + w,
            outline=BRAND_SOFT + (26 - i * 6,),
            width=1,
        )
    # crisp inner outline
    draw.rounded_rectangle(box, radius=r, outline=ZONE_LINE + (150,), width=2)

    # small label under the zone
    font = load_font(15)
    tw = draw.textlength(label, font=font)
    draw.text(
        (x + size / 2 - tw / 2, y + size + pad + 8),
        label,
        font=font,
        fill=TEXT_DIM + (230,),
    )


def draw_arrow(draw, p1, p2, color, alpha):
    """Gentle curved arrow from the app zone to the Applications zone."""
    x1, y1 = p1
    x2, y2 = p2
    mx = (x1 + x2) / 2
    my = min(y1, y2) - 46  # arc up above the icons

    # draw a quadratic bezier
    steps = 48
    pts = []
    for i in range(steps + 1):
        t = i / steps
        ix = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * mx + t**2 * x2
        iy = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * my + t**2 * y2
        pts.append((ix, iy))
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i + 1]], fill=color + (alpha,), width=2)

    # arrowhead at the end
    ang = math.atan2(pts[-1][1] - pts[-2][1], pts[-1][0] - pts[-2][0])
    for da in (0.42, -0.42):
        ex = pts[-1][0] - 12 * math.cos(ang + da)
        ey = pts[-1][1] - 12 * math.sin(ang + da)
        draw.line([pts[-1], (ex, ey)], fill=color + (alpha,), width=2)


def build(out_path, win_w, win_h):
    w, h = win_w * SCALE, win_h * SCALE

    # ---- base gradient (deep navy → near-black) ----
    img = Image.new("RGBA", (w, h), BG_TOP)
    px = img.load()
    for y in range(h):
        t = y / h
        t = t * t  # ease toward dark
        r = int(lerp(BG_TOP[0], BG_BOTTOM[0], t))
        g = int(lerp(BG_TOP[1], BG_BOTTOM[1], t))
        b = int(lerp(BG_TOP[2], BG_BOTTOM[2], t))
        for x in range(w):
            px[x, y] = (r, g, b, 255)

    draw = ImageDraw.Draw(img, "RGBA")

    # ---- ambient glows ----
    radial_glow(draw, w, h, int(w * 0.5), int(h * 0.42), int(w * 0.62), BRAND_SOFT, 26)
    radial_glow(draw, w, h, int(w * 0.16), int(h * 0.8), int(w * 0.5), BRAND_SOFT, 16)

    # ---- dot grid ----
    draw_dot_grid(draw, w, h, spacing=SCALE * 26, radius=SCALE * 1.1,
                  color=BRAND, alpha=16)

    # ---- top brand block ----
    glyph = 30 * SCALE
    gx, gy = w // 2 - glyph - 10 * SCALE, 34 * SCALE
    # 2x2 brand squares
    sq = glyph / 2 - 2 * SCALE
    for i in range(2):
        for j in range(2):
            fill = BRAND if (i + j) % 2 == 0 else BRAND_DEEP
            draw.rounded_rectangle(
                [gx + i * sq + i * 4 * SCALE, gy + j * sq + j * 4 * SCALE,
                 gx + (i + 1) * sq + i * 4 * SCALE, gy + (j + 1) * sq + j * 4 * SCALE],
                radius=4 * SCALE, fill=fill + (255,),
            )
    word = "VibeGrid"
    font_word = load_font(40 * SCALE, bold=True)
    wx = gx + glyph + 16 * SCALE
    draw.text((wx, gy - 2 * SCALE), word, font=font_word, fill=WHITE + (255,))

    tag = "Install VibeGrid"
    font_tag = load_font(15 * SCALE)
    tw = draw.textlength(tag, font=font_tag)
    draw.text((w // 2 - tw / 2, 110 * SCALE), tag, font=font_tag, fill=TEXT_DIM + (255,))

    # ---- drop zones (logical point coords → 2x pixels) ----
    draw_zone_outline(draw, (APP_ZONE[0] * SCALE, APP_ZONE[1] * SCALE),
                      ICON_SIZE * SCALE, "VibeGrid")
    draw_zone_outline(draw, (FOLDER_ZONE[0] * SCALE, FOLDER_ZONE[1] * SCALE),
                      ICON_SIZE * SCALE, "Applications")

    # ---- arrow from app zone to folder zone ----
    a_center = ((APP_ZONE[0] + ICON_SIZE / 2) * SCALE,
                (APP_ZONE[1] + ICON_SIZE / 2) * SCALE)
    f_center = ((FOLDER_ZONE[0] + ICON_SIZE / 2) * SCALE,
                (FOLDER_ZONE[1] + ICON_SIZE / 2) * SCALE)
    draw_arrow(draw, a_center, f_center, BRAND, 120)

    # ---- footer copy ----
    footer = "Drag the VibeGrid icon to the Applications folder to install"
    font_footer = load_font(14 * SCALE)
    tw = draw.textlength(footer, font=font_footer)
    draw.text((w // 2 - tw / 2, h - 40 * SCALE), footer, font=font_footer,
              fill=TEXT_DIM + (220,))

    version = "v0.1.0"
    font_ver = load_font(11 * SCALE)
    tw = draw.textlength(version, font=font_ver)
    draw.text((w - tw - 14 * SCALE, h - 24 * SCALE), version, font=font_ver,
              fill=TEXT_DIM + (140,))

    # CRITICAL: save as RGB (NO alpha channel). Finder refuses to render an
    # RGBA PNG as a DMG window background — the volume opens with a plain
    # WHITE background instead of the image (a long-standing macOS Finder
    # quirk). The design is fully opaque, so flattening alpha loses nothing.
    rgb = img.convert("RGB")
    rgb.save(out_path)
    print(f"wrote {out_path} ({w}x{h}, logical {win_w}x{win_h}, RGB no-alpha)")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="src-tauri/icons/dmg-background.png",
                    help="output PNG path")
    ap.add_argument("--size", default=f"{WINDOW_W}x{WINDOW_H}",
                    help="logical window size WxH (must match dmg.windowSize)")
    args = ap.parse_args()

    try:
        w_str, h_str = args.size.lower().split("x")
        win_w, win_h = int(w_str), int(h_str)
    except ValueError:
        sys.exit(f"bad --size {args.size!r}; expected WxH e.g. 660x400")

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    build(args.out, win_w, win_h)


if __name__ == "__main__":
    main()
