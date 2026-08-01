#!/bin/bash
# Fetch the RetroArch Windows runtime + the libretro cores this app bundles into
# native/retroarch/. Run before scripts/package-portable.mjs. Needs 7-Zip.
set -e
cd "$(dirname "$0")/.."
mkdir -p native && cd native
SZ="/c/Program Files/7-Zip/7z.exe"

echo "== RetroArch Windows x64 =="
if [ ! -f retroarch/retroarch.exe ]; then
  curl -sL -o retroarch.7z \
    "https://buildbot.libretro.com/stable/1.19.1/windows/x86_64/RetroArch.7z"
  "$SZ" x -y -oretroarch retroarch.7z >/dev/null
  # flatten RetroArch-Win64/ up one level
  if [ -d retroarch/RetroArch-Win64 ]; then
    mv retroarch/RetroArch-Win64/* retroarch/ && rmdir retroarch/RetroArch-Win64
  fi
  rm -f retroarch.7z
fi

echo "== libretro cores (heavy platforms) =="
mkdir -p retroarch/cores
BB="https://buildbot.libretro.com/nightly/windows/x86_64/latest"
for c in dolphin flycast pcsx2 mednafen_saturn citra ppsspp \
         mupen64plus_next mednafen_psx_hw fbneo; do
  if [ ! -f "retroarch/cores/${c}_libretro.dll" ]; then
    curl -sL "$BB/${c}_libretro.dll.zip" -o /tmp/core.zip \
      && "$SZ" x -y -oretroarch/cores /tmp/core.zip >/dev/null \
      && echo "  $c" || echo "  ! $c unavailable"
  fi
done
echo "done: $(ls retroarch/cores/*.dll 2>/dev/null | wc -l) cores"
