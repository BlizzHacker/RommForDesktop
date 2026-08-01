// Exposes the native local-emulation bridge to the renderer. The web client
// checks window.RommNative to decide whether heavy platforms are playable
// (bundled RetroArch) in addition to the in-webview EmulatorJS.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

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
