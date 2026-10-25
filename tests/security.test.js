'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { serverUrl, sameServer, childPath, requireLocalSender } = require('../lib/security');
test('server accepts explicit HTTP/HTTPS and refuses executable or credential-bearing URLs', () => {
  assert.equal(serverUrl('https://romm.example.com/'), 'https://romm.example.com');
  assert.equal(serverUrl('http://192.168.1.5:8080'), 'http://192.168.1.5:8080');
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'https://user:pass@example.com', 'https://example.com?token=x', 'https://example.com/#x', '']) assert.throws(() => serverUrl(url));
});
test('downloads and redirects remain on the configured origin', () => {
  assert(sameServer('https://romm.example.com/api/roms/1/content?download=1', 'https://romm.example.com'));
  assert(!sameServer('https://evil.example/file', 'https://romm.example.com'));
  assert(!sameServer('http://romm.example.com/file', 'https://romm.example.com'));
  assert(!sameServer('https://user:pass@romm.example.com/file', 'https://romm.example.com'));
});
test('native resource and cache names cannot escape their root', () => {
  const root = path.resolve('cache');
  assert.equal(childPath(root, 'game.sfc'), path.join(root, 'game.sfc'));
  for (const name of ['..', '.', '../outside.dll', 'sub/file.dll', 'sub\\file.dll', '']) assert.throws(() => childPath(root, name));
});
test('only the expected window main frame on the exact packaged page can use IPC', () => {
  const local = path.resolve('app/setup.html');
  const contents = { mainFrame: { url: pathToFileURL(local).href } };
  const window = { webContents: contents };
  const event = { sender: contents, senderFrame: contents.mainFrame };
  assert.doesNotThrow(() => requireLocalSender(event, window, local));
  assert.throws(() => requireLocalSender({ ...event, sender: {} }, window, local));
  assert.throws(() => requireLocalSender({ ...event, senderFrame: { url: contents.mainFrame.url } }, window, local));
  contents.mainFrame.url = 'https://romm.example.com/console';
  assert.throws(() => requireLocalSender(event, window, local));
});
