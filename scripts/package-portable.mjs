// Builds a portable Windows distributable WITHOUT electron-builder, which fails
// on this box because it always extracts a winCodeSign archive full of macOS
// dylib symlinks and symlink creation needs admin / Developer Mode here.
//
// This copies the prebuilt Electron runtime, renames the exe to our brand,
// drops our app in resources/app, and bundles native/retroarch as
// resources/retroarch (where main.js's process.resourcesPath lookup finds it).
// Output: dist-manual/RommForDesktop/  and a .zip if 7-Zip is on PATH.
//
// Usage: node scripts/package-portable.mjs

import { cpSync, rmSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'dist-manual', 'RommForDesktop');
const electronDist = resolve(root, 'node_modules', 'electron', 'dist');
const retroarch = resolve(root, 'native', 'retroarch');

if (!existsSync(electronDist)) throw new Error('run npm install first');
rmSync(resolve(root, 'dist-manual'), { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync(electronDist, out, { recursive: true });
renameSync(resolve(out, 'electron.exe'), resolve(out, 'RommForDesktop.exe'));

const appDir = resolve(out, 'resources', 'app');
mkdirSync(appDir, { recursive: true });
for (const f of ['main.js', 'preload.js', 'package.json']) {
  cpSync(resolve(root, f), resolve(appDir, f));
}
cpSync(resolve(root, 'app'), resolve(appDir, 'app'), { recursive: true });

if (existsSync(retroarch)) {
  cpSync(retroarch, resolve(out, 'resources', 'retroarch'), { recursive: true });
  console.log('bundled RetroArch + cores');
} else {
  console.log('WARNING: native/retroarch missing — heavy platforms will stream');
}

console.log('portable app: ' + out);

// Zip it if 7-Zip is available.
const sevenZip = 'C:\\Program Files\\7-Zip\\7z.exe';
if (existsSync(sevenZip)) {
  const zip = resolve(root, 'dist-manual', 'RommForDesktop-Windows-Portable.zip');
  spawnSync(sevenZip, ['a', '-tzip', '-mx1', zip, out], { stdio: 'inherit' });
  console.log('zip: ' + zip);
}
