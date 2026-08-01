// Preload bridge. Two roles:
//  * cartridge.*  — the first-run setup page reads/writes the server config and
//    asks the shell to authenticate and open RomM's /console.
//  * RommNative.* — legacy native-RetroArch bridge, kept for any build that still
//    uses the bundled-emulator path. /console does its own emulation in-webview,
//    so it simply ignores these.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cartridge', {
  getCfg: () => ipcRenderer.invoke('cfg:get'),
  saveCfg: (cfg) => ipcRenderer.invoke('cfg:save', cfg),
});

contextBridge.exposeInMainWorld('RommNative', {
  platform: process.platform,
  available: () => ipcRenderer.invoke('native:available'),
  cores: () => ipcRenderer.invoke('native:cores'),
  cacheRom: (url, headers, name) =>
    ipcRenderer.invoke('rom:cache', { url, headers, name }),
  launch: (core, romPath, fullscreen) =>
    ipcRenderer.invoke('native:launch', { core, romPath, fullscreen }),
  stop: () => ipcRenderer.invoke('native:stop'),
});
