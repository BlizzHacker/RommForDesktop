#!/usr/bin/env python3
"""Resample an existing master icon to every size each platform needs.

We keep the existing, hand-made RomM icon (neon gamepad + wordmark) as the
single source of truth and Lanczos-downscale it everywhere, so Desktop, Xbox
MSIX, and Roku all show the exact same mark. This does NOT redraw the art — it
only resizes a good master, which is what "uniform across all versions" means.

    python resample_icon.py <master.png> <out_dir> [ground_hex]
"""
import sys
from pathlib import Path
from PIL import Image

# name -> square px, or (w, h) for non-square (letterboxed on the ground colour)
SIZES = {
    # Windows MSIX / Microsoft Store
    'Square44x44Logo.png': 44, 'Square71x71Logo.png': 71,
    'Square150x150Logo.png': 150, 'Square310x310Logo.png': 310,
    'Square480x480Logo.png': 480, 'StoreLogo.png': 50,
    'Wide310x150Logo.png': (310, 150), 'SplashScreen.png': (620, 300),
    # generic PNG app icons
    'icon_16.png': 16, 'icon_32.png': 32, 'icon_48.png': 48,
    'icon_64.png': 64, 'icon_128.png': 128, 'icon_256.png': 256,
    'icon_512.png': 512,
    # Roku channel art (BrightScript SceneGraph poster art)
    'roku_hd_290x218.png': (290, 218), 'roku_fhd_336x210.png': (336, 210),
    'roku_focus_540x405.png': (540, 405),
}
ICO_SIZES = (16, 24, 32, 48, 64, 128, 256)


def ground_of(im):
    """Sample the top-left pixel as the letterbox/background colour."""
    return im.convert('RGB').getpixel((2, 2))


def main():
    master_path = Path(sys.argv[1])
    outdir = Path(sys.argv[2])
    outdir.mkdir(parents=True, exist_ok=True)
    m = Image.open(master_path).convert('RGBA')
    # square the master if needed (centre-crop)
    if m.width != m.height:
        s = min(m.size)
        m = m.crop(((m.width - s) // 2, (m.height - s) // 2,
                    (m.width + s) // 2, (m.height + s) // 2))
    ground = (tuple(int(sys.argv[3][i:i+2], 16) for i in (1, 3, 5))
              if len(sys.argv) > 3 else ground_of(m))

    for name, spec in SIZES.items():
        if isinstance(spec, tuple):
            w, h = spec
            side = min(w, h)
            im = m.resize((side, side), Image.LANCZOS)
            canvas = Image.new('RGB', (w, h), ground)
            canvas.paste(im.convert('RGB'), ((w - side) // 2, (h - side) // 2),
                         im)
            canvas.save(outdir / name)
        else:
            m.resize((spec, spec), Image.LANCZOS).convert('RGB').save(
                outdir / name)

    ico = m.resize((256, 256), Image.LANCZOS)
    ico.save(outdir / 'icon.ico', format='ICO',
             sizes=[(s, s) for s in ICO_SIZES])
    print(f'wrote {len(SIZES) + 1} assets to {outdir} (ground={ground})')


if __name__ == '__main__':
    main()
