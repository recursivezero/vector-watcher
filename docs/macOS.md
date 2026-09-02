# macOS

This page describes building Vector Watcher on macOS.

---

## Build the Backend

On the target Mac:

```bash
cd backend
./build.sh
```

## Sidecar Target

- Apple Silicon - `vector-watcher-backend-aarch64-apple-darwin`
- Intel - `vector-watcher-backend-x86_64-apple-darwin`

## Build the Application

From the project root :

```bash
cd frontend
npm run clean
npm run tauri:build:mac
```

Recommended script:

```json
{
  "scripts": {
    "tauri:build:mac": "cd .. && tauri build --config src-tauri/tauri.prod.conf.json --bundles app,dmg"
  }
}
```

### Generated Outputs

- Application: _src-tauri/target/release/bundle/macos/Vector Watcher.app_

- DMG output: _src-tauri/target/release/bundle/dmg/_

The `.app` can be tested directly.

The `.dmg` is suitable for distribution.

### Python Shared Library Issue

If the packaged application produces:

Failed to load Python shared library libpython3.12.dylib

the PyInstaller executable may have been packaged without the complete runtime.

Expected PyInstaller structure:

```text
dist/
    ├── vector-watcher-backend
    └── _internal/
    └── libpython3.12.dylib
```

The executable depends on: _\_internal/libpython3.12.dylib_

Do not package only the executable without its required PyInstaller runtime.

Always test the packaged backend independently before assuming the Tauri frontend is responsible for a Load failed error.

### Screenshots

📷 Screenshot placeholder: Vector Watcher.app

📷 Screenshot placeholder: macOS installation

📷 Screenshot placeholder: DMG window
