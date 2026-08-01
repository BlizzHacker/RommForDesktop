#!/usr/bin/env python3
"""Original 'Cartridge' brand mark — a stylized SNES-style game cartridge.

Wholly our own art (no RomM logo), so it needs nobody's approval. Rendered at
1024px and downsampled by resample_icon.py to every platform size. Palette keeps
the ecosystem's navy ground + cyan accent so it still reads as part of the
MoveWeight family, just with our own silhouette.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

M = 1024
BG_IN = (26, 42, 74)
BG_OUT = (8, 13, 28)
CART = (30, 42, 74)         # cartridge body
CART_HI = (46, 62, 104)     # bevel highlight
ACCENT = (125, 211, 252)    # cyan
LABEL = (233, 245, 255)
SLOT = (14, 20, 38)


def radial(size):
    img = Image.new('RGB', (size, size))
    px = img.load()
    cx, cy = size * .5, size * .42
    maxd = math.hypot(size, size) * .62
    for y in range(size):
        for x in range(size):
            t = min(1., math.hypot(x - cx, y - cy) / maxd)
            px[x, y] = tuple(int(BG_IN[i] + (BG_OUT[i] - BG_IN[i]) * t)
                             for i in range(3))
    return img.convert('RGBA')


def rr(d, box, r, **kw):
    d.rounded_rectangle(box, radius=r, **kw)


def cartridge(size):
    lay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    S = size
    # body outline box
    bx0, by0, bx1, by1 = S * .24, S * .20, S * .76, S * .82
    r = S * .05
    # glow
    rr(d, [bx0, by0, bx1, by1], r, fill=CART + (255,),
       outline=ACCENT + (255,), width=max(3, S // 150))
    # top notch (where fingers grip) — two shoulder cuts
    notch_w = (bx1 - bx0) * .18
    d.rectangle([bx0 - 1, by0 - 1, bx0 + notch_w, by0 + S * .06],
                fill=(0, 0, 0, 0))
    # left grip ridges
    for i in range(3):
        rx = bx0 + (bx1 - bx0) * (.12 + i * .07)
        d.line([(rx, by0 + S * .015), (rx, by0 + S * .075)],
               fill=ACCENT + (200,), width=max(2, S // 300))
    # the label panel (lighter inset)
    lx0, ly0, lx1, ly1 = bx0 + S * .05, by0 + S * .12, bx1 - S * .05, by1 - S * .16
    rr(d, [lx0, ly0, lx1, ly1], S * .03, fill=(18, 26, 48, 255),
       outline=CART_HI + (255,), width=max(2, S // 260))
    # label "screen" — three scanline bars in accent, evoking a game frame
    for i in range(3):
        yy = ly0 + (ly1 - ly0) * (.22 + i * .26)
        w = (lx1 - lx0) * (.62 - i * .12)
        d.rounded_rectangle([lx0 + (lx1 - lx0) * .18, yy,
                             lx0 + (lx1 - lx0) * .18 + w, yy + S * .022],
                            radius=S * .011,
                            fill=ACCENT + (255 - i * 40,))
    # bottom connector slot
    cy0 = by1 - S * .10
    d.rounded_rectangle([bx0 + S * .04, cy0, bx1 - S * .04, by1 - S * .03],
                        radius=S * .012, fill=SLOT + (255,))
    for i in range(9):
        px = bx0 + S * .06 + i * ((bx1 - bx0 - S * .12) / 9)
        d.rectangle([px, cy0 + S * .012, px + S * .012, by1 - S * .045],
                    fill=(60, 78, 120, 255))
    glow = lay.filter(ImageFilter.GaussianBlur(S // 110))
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out = Image.alpha_composite(out, glow)
    out = Image.alpha_composite(out, lay)
    return out


def font(px):
    for n in ('seguibl.ttf', 'segoeuib.ttf', 'arialbd.ttf'):
        try:
            return ImageFont.truetype('C:/Windows/Fonts/' + n, px)
        except OSError:
            pass
    return ImageFont.load_default()


def main():
    out = Path('out/cartridge')
    out.mkdir(parents=True, exist_ok=True)
    img = radial(M)
    img.alpha_composite(cartridge(M))
    img.save(out / 'master_1024.png')
    print('wrote', out / 'master_1024.png')


if __name__ == '__main__':
    main()
