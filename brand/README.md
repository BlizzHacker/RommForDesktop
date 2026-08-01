# RomM ecosystem — shared brand

One mark, one palette, one voice across every version (Windows desktop, Xbox,
Roku, and the phone remote). This folder is the single source of truth so the
apps read as one product, not four.

## The mark

`RommForXbox/msix/Assets/Square480x480Logo.png` is the master: the **RomM**
wordmark over a neon-cyan-outlined gamepad on a dark-navy radial ground, with
colored A/B/X/Y face buttons. Every other size is a Lanczos downscale of it —
never a redraw — so the icon is pixel-consistent everywhere.

Regenerate all platform sizes from the master:

```bash
python resample_icon.py ../RommForXbox/msix/Assets/Square480x480Logo.png out/romm
```

Outputs (in `out/romm/`): the MSIX/Store `Square*Logo.png` + `StoreLogo.png` +
`Wide310x150Logo.png` + `SplashScreen.png`, generic `icon_16..512.png`, a
multi-res `icon.ico` for the desktop build, and Roku channel art
(`roku_hd_290x218`, `roku_fhd_336x210`, `roku_focus_540x405`).

Propagation targets:
- `RommForDesktop/build/icon.ico`  ← `out/romm/icon.ico`
- `RommForXbox/{msix,shell/.../}/Assets/*`  ← matching names
- `RommForRoku/images/*`  ← the `roku_*` art + `splash_hd.png`

## Palette

| token   | hex       | use                                  |
|---------|-----------|--------------------------------------|
| bg      | `#0A0E1A` | app ground / Roku splash color       |
| surface | `#141B2E` | panels                               |
| accent  | `#7DD3FC` | RomM cyan — glow, focus, brand       |
| warm    | `#FDB44B` | "plays locally" indicator            |
| good    | `#4ADE80` | success / A button                   |
| bad     | `#FF7B72` | error / B button                     |

Cryptic Realm's Roku companion is a sibling, not a clone: same layout and
gamepad, violet accent (`#A78BFA`) instead of cyan. It reuses the same
`resample_icon.py` against a violet master when that master exists.

## Names (customer-facing)

The product is **RomM** everywhere — not "RomM for Xbox" / "RomM for Desktop".
The platform is an implementation detail, not part of the name.

| surface            | display name | internal id                    |
|--------------------|--------------|--------------------------------|
| Windows / Xbox MSIX| RomM         | `MOVEWEIGHT.RomMforXbox`       |
| Windows desktop    | RomM         | `com.moveweight.rommdesktop`   |
| Roku channel       | RomM         | (channel manifest `title`)     |

## Voice

Plain, honest, second-person. Say what a thing does ("Play", then "Playing"),
name platforms by what people call them, and never claim a game streams when the
host can't render it — the tier text tells the truth ("plays on this PC",
"needs a stream server", "no emulator anywhere").
