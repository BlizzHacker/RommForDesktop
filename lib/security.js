'use strict';
const path = require('node:path');
const { fileURLToPath } = require('node:url');

function serverUrl(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Enter your own RomM server address.');
  const parsed = new URL(value);
  if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password || parsed.search || parsed.hash)
    throw new Error('Use an HTTP or HTTPS server address without credentials, a query or a fragment.');
  return parsed.href.replace(/\/$/, '');
}
function isLocalPage(value, allowed) {
  try { const url = new URL(value); return url.protocol === 'file:' && !url.search && !url.hash && path.resolve(fileURLToPath(url)) === path.resolve(allowed); }
  catch { return false; }
}
function requireLocalSender(event, window, allowed) {
  if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || !isLocalPage(event.senderFrame.url, allowed))
    throw new Error('This action is available only from the packaged Cartridge page.');
}
function sameServer(value, base) {
  try { const target = new URL(value); return ['https:', 'http:'].includes(target.protocol) && !target.username && !target.password && target.origin === new URL(serverUrl(base)).origin; }
  catch { return false; }
}
function childPath(root, name) {
  if (typeof name !== 'string' || !name || name === '.' || name === '..' || /[\\/]/.test(name) || path.basename(name) !== name)
    throw new Error('Invalid file name.');
  const candidate = path.resolve(root, name);
  if (path.dirname(candidate) !== path.resolve(root)) throw new Error('Path escaped its directory.');
  return candidate;
}
module.exports = { serverUrl, isLocalPage, requireLocalSender, sameServer, childPath };
