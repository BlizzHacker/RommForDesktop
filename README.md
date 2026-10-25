# Cartridge for Windows

A standalone desktop companion for your own [RomM](https://romm.app) server.
Open your library and play through RomM's console inside the app. You do not
need to install Python, Node.js, or a browser extension.

Cartridge is part of the [MoveWeight ecosystem](https://github.com/BlizzHacker/rom-hub/blob/master/BRAND.md).
[ROMarr](https://github.com/BlizzHacker/romarr) finds and organizes games;
Cartridge opens the RomM library where you play them. Both are optional parts
of your setup. This community client is not affiliated with or endorsed by RomM.

## Install

Requires Windows 10 or 11, 64-bit, and a reachable RomM server that supports
its `/console` interface.

1. Open [Releases](https://github.com/BlizzHacker/RommForDesktop/releases).
2. Download `Cartridge-Windows-Portable-<version>-x64.exe` to run without an
   installer, or `Cartridge-Windows-Setup-<version>-x64.exe` for a per-user install.
3. Run the app and enter **your own** RomM address, such as
   `https://romm.example.com`. Sign in with your RomM username and password,
   or leave them blank and use RomM's own sign-in screen.

The app has its own window; it does not open an external browser. Use
**Cartridge > Change RomM server** or **Ctrl+,** to return to setup. Press Alt
if the menu bar is hidden.

Builds are unsigned community releases. Microsoft Store submission and code
signing have not been completed. Pull requests also produce downloadable
Windows artifacts and smoke-test evidence under their Actions run.

## What plays

This release displays **your RomM server's console**, including its EmulatorJS
player. Emulation runs on your PC when that player supports the platform and
ROM format. It does not guarantee every system, core, archive or game will boot.

RetroArch is **not included** in the standard release. Missing optional native
resources do not prevent building or using the app. The older local-player and
streaming source files remain for development, but are not the active `/console`
experience. No pairing, streaming or heavy-platform guarantee is made by this build.

## Privacy and saved data

Cartridge stores the server address and username in
`%APPDATA%\Cartridge\config.json`. Passwords are used only for the immediate
sign-in and are never saved by Cartridge. Opening configuration from an older
release removes its previously saved plaintext password. RomM still manages its
own session cookies in Electron's profile.

Use HTTPS outside your trusted network. HTTP is supported for local servers.
Remote pages cannot access the app's configuration or native IPC actions;
popups and navigation outside the configured server are blocked.

Uninstalling or replacing the app preserves its profile. Removing
`%APPDATA%\Cartridge` resets the client and its local cookies/cache; it does not
remove anything from your RomM server.

## Build and prove it

Use Node.js 24 on Windows:

```powershell
npm ci
npm test
npm run dist
```

The build produces both the portable executable and NSIS installer under
`dist/`. `com.moveweight.rommdesktop` remains the application ID, and the
existing `Cartridge` profile location is preserved.

The Windows Actions workflow tests URL/path validation, privileged IPC sender
checks, password migration and persistence behavior. It then launches both the
packaged app and portable executable against a local mock RomM console and
checks that remote pages cannot use privileged IPC. It saves a setup screenshot
and JSON proof report alongside the executable artifacts. Tagging `v*` publishes
the executables only after those checks pass.

For development builds that need the legacy native bridge, fetch your own
RetroArch runtime into `native/retroarch/` before building. The build includes
it only when `retroarch.exe` exists there. Console firmware and ROMs are never
provided by Cartridge.

## Other devices

[Xbox](https://github.com/BlizzHacker/RommForXbox) and
[Roku](https://github.com/BlizzHacker/RommForRoku) have separate companion apps.
Their installation and playback limits differ from this Windows client.

## License and credits

Cartridge's client code is [MIT licensed](LICENSE). See
[third-party notices](THIRD-PARTY-NOTICES.md) for Electron/Chromium notices and
credits to RomM, EmulatorJS and optional RetroArch components. Their licenses
and trademarks remain their own.
