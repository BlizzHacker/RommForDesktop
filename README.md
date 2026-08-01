# RomM for Desktop

<table><tr><td>

**Part of [Cartridge](https://github.com/BlizzHacker/rom-hub/blob/master/BRAND.md) by MoveWeight** — a self-hosted retro-gaming ecosystem. Run the whole stack, not just this piece:

```
MoveWeight
└── Cartridge                                  play + acquire your library
    ├── ROMarr  ─────────────  request a game, it finds / grabs / files it
    │   └── ROM Hub + plugins   backend-agnostic sources (RomM/Gaseous/Retrom)
    └── Apps                    Desktop · Xbox · Roku · Stream server
```

**Acquire:** [ROMarr](https://github.com/BlizzHacker/romarr) · [ROM Hub](https://github.com/BlizzHacker/rom-hub) — **Play:** [Desktop](https://github.com/BlizzHacker/RommForDesktop) · [Xbox](https://github.com/BlizzHacker/RommForXbox) · [Roku](https://github.com/BlizzHacker/RommForRoku) · [Stream](https://github.com/BlizzHacker/RommStreamServer)

<sub>Unofficial; not affiliated with or endorsed by RomM, Gaseous or Retrom.</sub>

</td></tr></table>



A project of the [Move Weight Foundation](https://foundation.moveweight.com).

Play your self-hosted [RomM](https://github.com/rommapp/romm) retro library on
Windows — **the emulation runs locally on your PC, not on any cloud server.**

## How it plays

| Systems | Engine | Where the work happens |
|---|---|---|
| NES, SNES, N64, GB/GBC/GBA, NDS, Genesis, SMS/GG, 32X, Sega CD, PSX, PSP, Arcade, Atari, Lynx, Jaguar, 3DO, PCE, WonderSwan, C64, Amiga, DOS… | **EmulatorJS** (in-app) | Your PC (the app's own engine) |
| GameCube, Wii, Dreamcast, PS2, Saturn, 3DS, N64/PSX/PSP hi-fidelity | **bundled RetroArch** | Your PC (native libretro cores) |
| Anything with no local core | stream (optional) | Your RomM stream server |

The app points at **your** RomM server, pairs or signs in, downloads the ROM to
a local cache, and emulates it on this machine. No Move Weight server is in the
play path.

## Run it

Portable — no installer, no admin:

1. Download `RommForDesktop-Windows-Portable.zip` and unzip anywhere.
2. Run `RommForDesktop.exe`.
3. Enter your RomM server address, sign in (pair or password), pick a game.

## Sign in

RomM 4.9 client-token **pairing** (preferred — the app only holds a scoped,
revocable token, never your password), or username/password.

## Build from source

```
npm install
node scripts/package-portable.mjs   # -> dist-manual/RommForDesktop/ + .zip
```

`native/retroarch/` (the RetroArch runtime + `cores/*.dll`) is gitignored for
size; fetch it with `scripts/fetch-retroarch.sh` before packaging, or the heavy
platforms fall back to streaming.

## Other platforms

- **Android** — RetroArch is native on Android; a Capacitor build with a
  libretro plugin is planned (phase 2).
- **Xbox** — retail consoles cannot run native RetroArch (locked platform);
  only Dev Mode can. Retail Xbox and Roku use the stream fallback
  ([RommStreamServer](https://github.com/BlizzHacker/RommStreamServer)) so every
  device gets the library regardless of its limits.
