# Windows

Windows builds must use a backend packaged specifically for Windows.

A Linux or macOS PyInstaller executable cannot be reused on Windows.

---

## Backend

The Windows sidecar should follow the Tauri target naming convention:

```text
vector-watcher-backend-x86_64-pc-windows-msvc.exe
```

Build the Backend

From the backend directory:

`.\build.ps1`

Or use the Windows equivalent backend build process.

Build the Windows Installer

Recommended script:

```json
{
  "scripts": {
    "tauri:build:windows": "cd .. && tauri build --config src-tauri/tauri.prod.conf.json --bundles nsis"
  }
}
```

Run:

`npm run tauri:build:windows`

The installer will be generated under *src-tauri/target/release/bundle/nsis/*

## MSI Alternative

To build MSI instead:

```json
{
  "scripts": {
    "tauri:build:windows": "tauri build --config src-tauri/tauri.prod.conf.json --bundles msi"
  }
}
```

### Screenshots

📷 Screenshot placeholder: Windows installer

📷 Screenshot placeholder: Installed application

📷 Screenshot placeholder: Windows application shortcut

### Future Documentation

TODO: Confirm supported Windows versions.

TODO: Add installation instructions.

TODO: Add Windows Defender / SmartScreen guidance.

TODO: Add code signing documentation.
