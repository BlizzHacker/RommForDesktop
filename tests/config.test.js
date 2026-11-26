'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const config = require('../lib/config');
function fixture(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cartridge-config-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return path.join(dir, 'config.json'); }
test('passwords and tokens are never persisted or returned', t => {
  const file = fixture(t);
  config.save(file, { server: 'https://romm.example.com', user: 'player', pass: 'secret-password', token: 'secret-token' });
  assert.deepEqual(config.load(file), { server: 'https://romm.example.com', user: 'player' });
  assert(!fs.readFileSync(file, 'utf8').includes('secret'));
});
test('loading an older plaintext config removes its password before returning', t => {
  const file = fixture(t); fs.writeFileSync(file, JSON.stringify({ server: 'https://romm.example.com', user: 'player', pass: 'legacy-secret' }));
  assert.equal(config.load(file).pass, undefined);
  assert(!fs.readFileSync(file, 'utf8').includes('legacy-secret'));
  assert(!fs.existsSync(file + '.tmp'));
});
test('invalid server does not replace existing configuration', t => {
  const file = fixture(t); config.save(file, { server: 'https://romm.example.com' });
  assert.throws(() => config.save(file, { server: 'file:///etc/passwd' }));
  assert.equal(config.load(file).server, 'https://romm.example.com');
});
test('corrupt config is reported and preserved', t => {
  const file = fixture(t); fs.writeFileSync(file, '{broken'); assert.throws(() => config.load(file), /Cannot read/); assert.equal(fs.readFileSync(file, 'utf8'), '{broken');
});

test('non-object configuration is reported and preserved', t => {
  const file = fixture(t); fs.writeFileSync(file, 'null'); assert.throws(() => config.load(file), /Cannot read/); assert.equal(fs.readFileSync(file, 'utf8'), 'null');
});

test('ROMarr handoff opens only a saved HTTP(S) server and a fixed library route', t => {
  const file = fixture(t);
  config.save(file, { server: 'https://romm.example.com', romarr: 'https://romarr.example.com/' });
  assert.equal(config.ownedGamesUrl(config.load(file)), 'https://romarr.example.com/#lists');
  assert.equal(config.ownedGamesUrl({}), '');
  for (const unsafe of ['steam://install/123', 'https://key@romarr.example.com', 'https://romarr.example.com/?key=hidden']) {
    assert.throws(() => config.save(file, { server: 'https://romm.example.com', romarr: unsafe }));
  }
  assert.equal(config.ownedGamesUrl(config.load(file)), 'https://romarr.example.com/#lists');
});
