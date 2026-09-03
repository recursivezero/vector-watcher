# Release Workflow

Each platform requires its own native backend and Tauri application build.

---

## Linux Release

Build the backend:

```bash
cd backend
./build.sh
```

Return to the project frontend:

```bash
cd ../frontend
npm run clean
npm run tauri:build:linux
```

Install the generated package:

`sudo apt install "./src-tauri/target/release/bundle/deb/Vector Watcher_1.1.0_amd64.deb"`

## macOS Release

Build the backend:

```bash
cd backend
./build.sh
```

Return to the project frontend:

```bash
cd ../frontend
npm run clean
npm run tauri:build:mac
```

The output contains:

*Vector Watcher.app* and optionally *Vector Watcher.dmg*

## Windows Release

Build the backend:

```bash
cd backend
.\build.ps1
```

Return to the project frontend:

```bash
cd ../frontend
npm run clean
npm run tauri:build:windows
```

The installer is generated under: *src-tauri/target/release/bundle/nsis/*

### Cleaning Old Build Artifacts

Tauri does not always remove old bundle artifacts.

For example, an old AppImage directory may remain even after building only a .deb.

Remove old artifacts:

`rm -rf src-tauri/target/release/bundle` or run `npm run clean`

Then rebuild:

`npm run tauri:build:linux`

### Explicit Bundle Targets

Avoid generating unnecessary bundle formats.

Examples:

-- bundles deb  
-- bundles app,dmg  
-- bundles nsis  

This keeps builds faster and release artifacts cleaner.
