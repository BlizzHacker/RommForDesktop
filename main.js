// Cartridge for Windows: isolated desktop access to your own RomM console.
'use strict';
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { createHash, randomUUID } = require('node:crypto');
const https = require('node:https');
const http = require('node:http');
const { serverUrl, isLocalPage, requireLocalSender, sameServer, childPath } = require('./lib/security');
const config = require('./lib/config');
const smokeArg = process.argv.find(arg => arg.startsWith('--smoke-test='));
if (smokeArg) { const smokeRoot = path.resolve(smokeArg.slice('--smoke-test='.length)); fs.mkdirSync(smokeRoot, { recursive: true }); app.setPath('userData', smokeRoot); }
else app.setPath('userData', path.join(app.getPath('appData'), 'Cartridge'));
const ROM_CACHE = path.join(app.getPath('userData'), 'rom-cache');
const CFG_PATH = path.join(app.getPath('userData'), 'config.json');
const SETUP = path.join(__dirname, 'app', 'setup.html');
const LEGACY = path.join(__dirname, 'app', 'index.html');
let win, raProc = null, activeServer = '';
function retroarchDir() {
  const packaged = path.join(process.resourcesPath || '', 'retroarch');
  return fs.existsSync(packaged) ? packaged : path.join(__dirname, 'native', 'retroarch');
}
function retroarchExe() { return path.join(retroarchDir(), process.platform === 'win32' ? 'retroarch.exe' : 'retroarch'); }
function local(event, page = SETUP) { requireLocalSender(event, win, page); }
function stopNative() { if (raProc) { raProc.kill(); raProc = null; } }
function rommLogin(base, user, pass) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + '/api/login');
    const request = (url.protocol === 'https:' ? https : http).request(url, {
      method: 'POST', timeout: 15000,
      headers: { Authorization: 'Basic ' + Buffer.from(user + ':' + pass).toString('base64') },
    }, response => {
      const cookie = (response.headers['set-cookie'] || []).map(c => c.split(';')[0]).find(c => c.startsWith('romm_session='));
      response.resume();
      if (response.statusCode >= 200 && response.statusCode < 300 && cookie) resolve(cookie.slice('romm_session='.length));
      else reject(new Error('RomM sign-in failed (HTTP ' + response.statusCode + '). Check your username and password.'));
    });
    request.on('timeout', () => request.destroy(new Error('RomM sign-in timed out.')));
    request.on('error', reject); request.end();
  });
}
async function authAndLoad(cfg, password = '') {
  const base = serverUrl(cfg.server);
  if (cfg.user && password) {
    const value = await rommLogin(base, cfg.user, password);
    await win.webContents.session.cookies.set({ url: base, name: 'romm_session', value, path: '/', secure: new URL(base).protocol === 'https:', httpOnly: true });
  }
  activeServer = base;
  await win.loadURL(base + '/console');
}
function setup() { return win.loadFile(SETUP); }
function createWindow() {
  win = new BrowserWindow({ width: 1280, height: 800, minWidth: 720, minHeight: 500,
    title: 'Cartridge for Windows', backgroundColor: '#0B1020', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true,
      sandbox: true, nodeIntegration: false, webSecurity: true, webgl: true, backgroundThrottling: false },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  const guardNavigation = (event, url) => {
    let cfg = {}; try { cfg = config.load(CFG_PATH); } catch { }
    if (!isLocalPage(url, SETUP) && !sameServer(url, activeServer || cfg.server)) event.preventDefault();
  };
  win.webContents.on('will-navigate', guardNavigation);
  win.webContents.on('will-redirect', guardNavigation);
  win.webContents.on('will-attach-webview', event => event.preventDefault());
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Cartridge', submenu: [
      { label: 'Change RomM server', accelerator: 'CmdOrCtrl+,', click: setup },
      { type: 'separator' }, { role: 'quit' },
    ] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'togglefullscreen' }, { role: 'resetzoom' }, { role: 'zoomin' }, { role: 'zoomout' }] },
  ]));
  let cfg;
  try { cfg = config.load(CFG_PATH); }
  catch (error) { dialog.showErrorBox('Cartridge configuration', error.message); setup(); return; }
  if (cfg.server && !smokeArg) authAndLoad(cfg).catch(error => { dialog.showErrorBox('Could not open RomM', error.message); setup(); });
  else setup();
}
ipcMain.handle('cfg:get', event => { local(event); return config.load(CFG_PATH); });
ipcMain.handle('cfg:save', async (event, cfg) => {
  local(event);
  const clean = config.sanitize(cfg);
  if (!clean.server) throw new Error('Enter your own RomM server address.');
  // The password is used for this sign-in only; it is never saved or returned.
  await authAndLoad(clean, typeof cfg.pass === 'string' ? cfg.pass : '');
  config.save(CFG_PATH, clean);
  return true;
});
ipcMain.handle('native:available', event => { local(event, LEGACY); return fs.existsSync(retroarchExe()); });
ipcMain.handle('native:cores', event => {
  local(event, LEGACY);
  try { return fs.readdirSync(path.join(retroarchDir(), 'cores')).filter(f => /\.(dll|so|dylib)$/.test(f)); } catch { return []; }
});
ipcMain.handle('rom:cache', async (event, { url, headers, name }) => {
  local(event, LEGACY);
  const cfg = config.load(CFG_PATH);
  if (!sameServer(url, cfg.server)) throw new Error('ROM downloads must come from your configured RomM server.');
  fs.mkdirSync(ROM_CACHE, { recursive: true });
  const safe = String(name || '').replace(/[^\w.\- ()\[\]]/g, '_');
  const file = createHash('sha256').update(url).digest('hex').slice(0, 16) + '-' + childPath(ROM_CACHE, safe).split(path.sep).pop();
  const destination = childPath(ROM_CACHE, file);
  if (fs.existsSync(destination) && fs.statSync(destination).size > 0) return destination;
  await download(url, headers || {}, destination, cfg.server);
  return destination;
});
ipcMain.handle('native:launch', async (event, { core, romPath, fullscreen }) => {
  local(event, LEGACY);
  const coreFile = childPath(path.join(retroarchDir(), 'cores'), core);
  if (!/\.(dll|so|dylib)$/.test(core) || !fs.existsSync(coreFile)) throw new Error('That bundled core is unavailable.');
  if (path.dirname(path.resolve(romPath)) !== path.resolve(ROM_CACHE) || !fs.existsSync(romPath)) throw new Error('Choose a ROM from the app cache.');
  if (!fs.existsSync(retroarchExe())) return { ok: false, error: 'This build does not include RetroArch.' };
  stopNative();
  const args = ['-L', coreFile, romPath]; if (fullscreen !== false) args.push('--fullscreen');
  return new Promise(resolve => {
    const child = spawn(retroarchExe(), args, { cwd: retroarchDir(), detached: false }); raProc = child;
    child.once('error', error => { if (raProc === child) raProc = null; resolve({ ok: false, error: error.message }); });
    child.once('spawn', () => resolve({ ok: true }));
    child.once('exit', () => { if (raProc === child) raProc = null; });
  });
});
ipcMain.handle('native:stop', event => { local(event, LEGACY); stopNative(); return true; });

function download(url, headers, destination, base, redirects = 0) {
  if (!sameServer(url, base) || redirects > 5) return Promise.reject(new Error('Unsafe download redirect.'));
  return new Promise((resolve, reject) => {
    const temporary = destination + '.' + randomUUID() + '.part';
    let output;
    const fail = error => { if (output) output.destroy(); fs.rm(temporary, { force: true }, () => reject(error)); };
    const request = (new URL(url).protocol === 'https:' ? https : http).get(url, { headers, timeout: 30000 }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        return download(new URL(response.headers.location, url).href, headers, destination, base, redirects + 1).then(resolve, reject);
      }
      if (response.statusCode !== 200) { response.resume(); reject(new Error('HTTP ' + response.statusCode)); return; }
      output = fs.createWriteStream(temporary, { flags: 'wx' });
      response.on('error', fail); response.on('aborted', () => fail(new Error('Download was interrupted.')));
      output.on('error', fail);
      output.on('finish', () => output.close(() => {
        fs.rename(temporary, destination, error => error ? fail(error) : resolve(destination));
      }));
      response.pipe(output);
    });
    request.on('timeout', () => request.destroy(new Error('Download timed out.')));
    request.on('error', fail);
  });
}

async function smoke() {
  const root = app.getPath('userData'); fs.mkdirSync(root, { recursive: true });
  let server;
  try {
    await win.webContents.executeJavaScript(`document.title`);
    const ready = await win.webContents.executeJavaScript(`typeof window.cartridge?.getCfg === 'function'`);
    if (!ready) throw new Error('The packaged setup bridge did not load.');
    const refused = await win.webContents.executeJavaScript(`window.cartridge.saveCfg({server:'javascript:alert(1)'}).then(()=>false,()=>true)`);
    if (!refused) throw new Error('Unsafe server URL was accepted.');
    server = http.createServer((_request, response) => { response.writeHead(200, { 'content-type': 'text/html' }); response.end('<!doctype html><title>Cartridge test RomM</title><h1>RomM console</h1>'); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    config.save(CFG_PATH, { server: base, user: 'smoke', pass: 'must-never-be-saved' });
    await authAndLoad(config.load(CFG_PATH));
    const isolated = await win.webContents.executeJavaScript(`Promise.all([window.cartridge.getCfg().then(()=>false,()=>true),window.RommNative.available().then(()=>false,()=>true)])`);
    if (!isolated.every(Boolean)) throw new Error('Remote content reached privileged IPC.');
    if (fs.readFileSync(CFG_PATH, 'utf8').includes('must-never-be-saved')) throw new Error('Password was persisted.');
    await setup();
    const image = await win.webContents.capturePage(); fs.writeFileSync(path.join(root, 'setup.png'), image.toPNG());
    fs.writeFileSync(path.join(root, 'smoke-passed.json'), JSON.stringify({ nativeWindow: true, setup: true, remoteConsole: true, remoteIpcDenied: true, unsafeUrlDenied: true, plaintextPasswordAbsent: true, optionalRetroArch: fs.existsSync(retroarchExe()) }, null, 2));
    app.exit(0);
  } catch (error) { fs.writeFileSync(path.join(root, 'smoke-failed.txt'), error.stack); app.exit(1); }
  finally { if (server) server.close(); }
}
app.whenReady().then(async () => {
  createWindow();
  if (smokeArg) { await new Promise(resolve => win.webContents.once('did-finish-load', resolve)); await smoke(); }
});
app.on('before-quit', stopNative);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
