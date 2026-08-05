#!/usr/bin/env python3
"""Recolor the VibeGrid app icon from the legacy green to the brand azure blue.

The desktop icon is a dark green logo (hue ≈ 150°) with light-gray highlights.
A plain hue rotation would produce a muddy dark blue, so this script instead:

  1. Detects every green/cyan-teal pixel (hue 60°–200°, saturation ≥ 0.08,
     incl. low-alpha anti-aliasing halo and low-saturation edge blends).
  2. Remaps it onto the brand blue — oklch(0.66 0.16 252) ≈ #3c95f0
     (hsl(210°, 86%, 59%)) — preserving the logo's internal shading by
     scaling each pixel's saturation and lightness relative to the icon's
     dominant green shade, and keeping its per-pixel hue variation.
  3. Iterates to convergence so icons with several distinct green shades
     (e.g. a teal logo + a lime accent) are all remapped, not just the
     dominant one.
  4. Leaves near-neutral pixels (whites/grays) untouched and preserves alpha.

Requires: Pillow (pip install pillow)

Usage:
  python3 scripts/recolor-icon-to-brand-blue.py                 # defaults
  python3 scripts/recolor-icon-to-brand-blue.py a.png [b.png …] # explicit files
  python3 scripts/recolor-icon-to-brand-blue.py icon.png --hex 3c95f0 --out out.png
"""

import argparse
import sys
from collections import Counter
from PIL import Image

DEFAULT_FILES = [
    "src-tauri/icons/app-icon-master.png",
    "src-tauri/icons/desktop.png",
]
BRAND_HEX = "3c95f0"          # azure-blue accent used across the app

HUE_MIN, HUE_MAX = 60.0, 200.0  # green + cyan-teal band (degrees). The top
                                # edge extends to ~200° so low-alpha cyan
                                # anti-aliasing fringe (hue 180-182) is caught
                                # too — otherwise tauri icon upscales it into
                                # visible teal pixels in the 1254px desktop icon.
SAT_MIN = 0.08                  # catch low-saturation green edge blends
                                # (anti-aliased logo/background seams sit
                                # around sat 0.10-0.15); neutral grays have
                                # sat ~0 so they stay untouched


# --------------------------------------------------------------------------- #
#  Color math (pure Pillow/stdlib — no numpy needed)
# --------------------------------------------------------------------------- #

def rgb_to_hsl(r, g, b):
    """Return (hue 0..360, saturation 0..1, lightness 0..1)."""
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2.0
    if mx == mn:
        return 0.0, 0.0, l
    d = mx - mn
    s = d / (2.0 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == r:
        h = (g - b) / d + (6.0 if g < b else 0.0)
    elif mx == g:
        h = (b - r) / d + 2.0
    else:
        h = (r - g) / d + 4.0
    h *= 60.0
    if h >= 360.0:
        h -= 360.0
    return h, s, l


def hsl_to_rgb(h, s, l):
    """Inverse of rgb_to_hsl. Returns an (r, g, b) tuple (0..255)."""
    h = h % 360.0
    if s == 0.0:
        v = int(round(l * 255.0))
        return (v, v, v)

    def hue2rgb(p, q, t):
        t %= 1.0
        if t < 1.0 / 6.0:
            return p + (q - p) * 6.0 * t
        if t < 0.5:
            return q
        if t < 2.0 / 3.0:
            return p + (q - p) * (2.0 / 3.0 - t) * 6.0
        return p

    q = l * (1.0 + s) if l < 0.5 else l + s - l * s
    p = 2.0 * l - q
    h /= 360.0
    r = hue2rgb(p, q, h + 1.0 / 3.0)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1.0 / 3.0)
    return (int(round(r * 255)), int(round(g * 255)), int(round(b * 255)))


def is_green(r, g, b):
    h, s, _ = rgb_to_hsl(r, g, b)
    return s >= SAT_MIN and HUE_MIN <= h <= HUE_MAX


# --------------------------------------------------------------------------- #
#  Recoloring
# --------------------------------------------------------------------------- #

def dominant_green_base(pixels):
    """Find the icon's dominant green shade -> (base_hue, base_sat, base_light).

    The 'base' is the most frequent quantized green colour; per-pixel
    saturation/lightness are scaled relative to it so the bulk of the logo
    lands exactly on the brand blue.
    """
    counter = Counter()
    for r, g, b, a in pixels:
        if a < 40:
            continue
        h, s, l = rgb_to_hsl(r, g, b)
        if is_green(r, g, b):
            key = (int(h // 8), int(s * 10), int(l * 10))
            counter[key] += 1
    if not counter:
        return 150.0, 0.5, 0.25  # fallback to the measured legacy green
    (hq, sq, lq), _ = counter.most_common(1)[0]
    return hq * 8 + 4, (sq + 0.5) / 10.0, (lq + 0.5) / 10.0


def recolor_pixels(pixels, target_rgb, base):
    th, ts, tl = rgb_to_hsl(*target_rgb)
    bh, bs, bl = base

    def clamp(v, lo, hi):
        return lo if v < lo else hi if v > hi else v

    out = []
    n_recolored = 0
    # Every pixel with alpha >= 1 is recolored, including the low-alpha
    # anti-aliasing halo (alpha 1-7) — those halo pixels otherwise keep their
    # green RGB and re-contaminate every downscaled size of the icon.
    for r, g, b, a in pixels:
        if a < 1 or not is_green(r, g, b):
            out.append((r, g, b, a))
            continue
        h, s, l = rgb_to_hsl(r, g, b)
        # Preserve per-pixel hue variation relative to the dominant green,
        # but clamp the delta so outlier shades (e.g. cyan fringe at ~200°
        # when the base is a lime accent at ~76°) can't wrap around to
        # magenta/purple — they stay within the blue family.
        delta = max(-40.0, min(40.0, h - bh))
        new_h = (th + delta) % 360.0
        new_s = clamp(ts * (s / bs if bs > 0 else 1.0), 0.0, 1.0)
        new_l = clamp(tl * (l / bl if bl > 0 else 1.0), 0.03, 0.97)
        nr, ng, nb = hsl_to_rgb(new_h, new_s, new_l)
        out.append((nr, ng, nb, a))
        n_recolored += 1
    return out, n_recolored


def dominant_color(pixels):
    counter = Counter((r // 32 * 32, g // 32 * 32, b // 32 * 32) for r, g, b, a in pixels if a > 40)
    if not counter:
        return "(transparent)"
    r, g, b = counter.most_common(1)[0][0]
    return "#{:02x}{:02x}{:02x}".format(r, g, b)


def process(path, hex_label, out_path=None):
    im = Image.open(path).convert("RGBA")
    pixels = list(im.getdata())
    target_rgb = hex_to_rgb(hex_label)

    before = dominant_color(pixels)

    # Iterate to convergence: an icon can contain several distinct green
    # shades (e.g. a dark teal logo plus a lime accent), and each pass
    # remaps relative to the CURRENT dominant green. One pass fixes the
    # dominant shade but can leave another behind, so loop until no green
    # pixels remain (each pass shrinks the green set, so this terminates).
    total = 0
    passes = 0
    recolored = pixels
    while True:
        base = dominant_green_base(recolored)
        recolored, n = recolor_pixels(recolored, target_rgb, base)
        total += n
        passes += 1
        if n == 0:
            break
        if passes >= 16:  # safety cap — never observed in practice
            print(f"warning: {path} still has green pixels after 16 passes",
                  file=sys.stderr)
            break

    if out_path is None:
        out_path = path
    out = Image.new("RGBA", im.size)
    out.putdata(recolored)
    out.save(out_path)
    after = dominant_color(list(out.getdata()))
    print(
        f"{path}: {im.size[0]}x{im.size[1]} | green px: {total} in {passes} pass(es) | "
        f"dominant {before} -> {after} (brand #{hex_label})"
    )


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="*", default=DEFAULT_FILES,
                    help="PNG files to recolor (default: the src-tauri icons)")
    ap.add_argument("--hex", default=BRAND_HEX,
                    help="target brand colour as hex, e.g. 3c95f0")
    ap.add_argument("--out", default=None,
                    help="output path (single input file only); default: in place")
    args = ap.parse_args()

    if args.out and len(args.files) != 1:
        sys.exit("--out requires exactly one input file")

    ok = True
    for f in args.files:
        try:
            process(f, args.hex, args.out)
        except FileNotFoundError:
            print(f"skipped (missing): {f}")
            ok = False
        except Exception as exc:  # noqa: BLE001 - report and continue
            print(f"failed {f}: {exc}")
            ok = False
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
