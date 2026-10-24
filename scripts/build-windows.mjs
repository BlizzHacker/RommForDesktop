import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build, Platform, Arch } = require('electron-builder');
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const native = join(root, 'native', 'retroarch');
const extraResources = existsSync(join(native, 'retroarch.exe'))
  ? [{ from: native, to: 'retroarch', filter: ['**/*'] }] : [];
console.log(extraResources.length ? 'Optional RetroArch resources included.' : 'Building the RomM console client without optional RetroArch resources.');
await build({ projectDir: root, targets: Platform.WINDOWS.createTarget(['nsis', 'portable'], Arch.x64), publish: 'never', config: { extraResources } });
