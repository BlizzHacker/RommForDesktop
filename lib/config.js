'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { serverUrl } = require('./security');
function sanitize(value) {
  if (!value || typeof value !== 'object') return {};
  const clean = {
    server: value.server ? serverUrl(value.server) : '',
    user: typeof value.user === 'string' ? value.user.slice(0, 256) : '',
  };
  if (value.romarr) clean.romarr = serverUrl(value.romarr);
  return clean;
}
function save(file, value) {
  const clean = sanitize(value);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + '.tmp';
  try { fs.writeFileSync(temporary, JSON.stringify(clean, null, 2), { mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
  return clean;
}
function load(file) {
  let raw;
  try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return {}; throw new Error('Cannot read saved Cartridge configuration. Preserve config.json and repair it before restarting.'); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Cannot read saved Cartridge configuration. Preserve config.json and repair it before restarting.');
  const clean = sanitize(raw);
  // Migrate older releases that wrote the RomM password as plain text.
  if ('pass' in raw || 'password' in raw || 'token' in raw) save(file, clean);
  return clean;
}
function ownedGamesUrl(value) {
  return value.romarr ? serverUrl(value.romarr) + '/#lists' : '';
}
module.exports = { sanitize, save, load, ownedGamesUrl };
