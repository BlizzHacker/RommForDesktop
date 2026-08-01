// RomM for Desktop — Electron shell that plays your RomM library LOCALLY.
//
// Two local engines, no cloud server does the emulation:
//   * EmulatorJS runs inside this Electron renderer (Chromium) for the systems
//     WASM handles well (NES..PSX/PSP-class). The ROM is downloaded from your
//     RomM server and emulated on THIS machine.
//   * Bundled RetroArch (native, in resources/retroarch/) is launched as a
//     child process for heavy 3D systems EmulatorJS can't do (GameCube, Wii,
//     PS2, Saturn, 3DS). Same story — your CPU/GPU does the work.
//
// The renderer is the existing RommForXbox web client; the only addition is an
// IPC bridge (preload.js) exposing native RetroArch launch + ROM caching.

'use strict';
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawn } = require('node:child_process');
const https = require('node:https');
const http = require('node:http');

const ROM_CACHE = path.join(app.getPath('userData'), 'rom-cache');
fs.mkdirSync(ROM_CACHE, { recursive: true });

// Where the bundled RetroArch lives once packaged; falls back to a dev path.
function retroarchDir() {
  const packaged = path.join(process.resourcesPath || '', 'retroarch');
  if (fs.existsSync(packaged)) return packaged;
  return path.join(__dirname, 'native', 'retroarch');
}
function retroarchExe() {
  const dir = retroarchDir();
  const exe = process.platform === 'win32' ? 'retroarch.exe' : 'retroarch';
  return path.join(dir, exe);
}
function corePath(coreFile) {
  return path.join(retroarchDir(), 'cores', coreFile);
}

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, backgroundColor: '#0B1020',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // EmulatorJS + game canvas want these; safe in a single-purpose app.
      webgl: true, backgroundThrottling: false,
    },
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });

/* ---- IPC: native RetroArch availability ---- */
ipcMain.handle('native:available', () => fs.existsSync(retroarchExe()));

ipcMain.handle('native:cores', () => {
  const dir = corePath('');
  try { return fs.readdirSync(dir).filter(f => f.endsWith('.dll') || f.endsWith('.so') || f.endsWith('.dylib')); }
  catch { return []; }
});

/* ---- IPC: download a ROM from RomM to the local cache (streamed) ---- */
ipcMain.handle('rom:cache', async (_e, { url, headers, name }) => {
  const safe = name.replace(/[^\w.\- ()\[\]]/g, '_');
  const dest = path.join(ROM_CACHE, safe);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;
  await download(url, headers || {}, dest);
  return dest;
});

/* ---- IPC: launch bundled RetroArch on a local ROM ---- */
let raProc = null;
ipcMain.handle('native:launch', (_e, { core, romPath, fullscreen }) => {
  if (raProc) { try { raProc.kill(); } catch {} raProc = null; }
  const exe = retroarchExe();
  if (!fs.existsSync(exe)) return { ok: false, error: 'RetroArch not bundled in this build' };
  const args = ['-L', corePath(core), romPath];
  if (fullscreen !== false) args.push('--fullscreen');
  raProc = spawn(exe, args, { cwd: retroarchDir(), detached: false });
  raProc.on('exit', () => { raProc = null; });
  return { ok: true };
});
ipcMain.handle('native:stop', () => { if (raProc) { try { raProc.kill(); } catch {} raProc = null; } return true; });

function download(url, headers, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, headers, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
      const tmp = dest + '.part';
      const out = fs.createWriteStream(tmp);
      res.pipe(out);
      out.on('finish', () => { out.close(() => { fs.renameSync(tmp, dest); resolve(dest); }); });
      out.on('error', reject);
    });
    req.on('error', reject);
  });
}
