# Vector Watcher

A cross-platform desktop application built with **Tauri**, with a **Python/FastAPI backend** packaged as a native sidecar using **PyInstaller**.

Vector Watcher packages the frontend, Rust/Tauri application, and Python backend into a single desktop application for:

* Linux
* macOS
* Windows

The Python backend runs locally and is started automatically when the Tauri application launches.

---

## Architecture

```text
┌──────────────────────────────────────────────┐
│                Vector Watcher                │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │            Tauri Frontend              │  │
│  │                                        │  │
│  │         React / TypeScript UI          │  │
│  └────────────────────┬───────────────────┘  │
│                       │ HTTP                 │
│                       │                      │
│                       ▼                      │
│            http://127.0.0.1:8765            │
│                       │                      │
│  ┌────────────────────▼───────────────────┐  │
│  │          Python Backend Sidecar        │  │
│  │                                        │  │
│  │         FastAPI / Uvicorn              │  │
│  │                                        │  │
│  │       Packaged with PyInstaller        │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

The backend is not expected to be installed separately by the end user.

When the packaged desktop application starts:

1. Tauri starts.
2. Tauri launches the packaged Python backend sidecar.
3. The backend starts Uvicorn on `127.0.0.1:8765`.
4. The frontend communicates with the backend through localhost.

When the application closes, Tauri terminates the backend process.

---

# Requirements

## Common

Install:

* Node.js
* npm
* Rust
* Cargo
* Python
* Poetry

Verify the installations:

```bash
node --version
npm --version
python --version
poetry --version
cargo --version
```

---

# Project Structure

A simplified project structure:

```text
vector-watcher/
│
├── backend/
│   ├── server.py
│   ├── main.py
│   ├── pyproject.toml
│   ├── poetry.lock
│   ├── build.sh
│   │
│   ├── build/
│   └── dist/
│
├── src/
│
├── src-tauri/
│   ├── binaries/
│   │
│   ├── src/
│   │   └── lib.rs
│   │
│   ├── tauri.conf.json
│   ├── tauri.prod.conf.json
│   │
│   └── target/
│
└── package.json
```

---

# Development

## Install frontend dependencies

From the project root:

```bash
npm install
```

---

## Install backend dependencies

From the `backend` directory:

```bash
cd backend
poetry install
```

---

## Run the backend manually

For development:

```bash
cd backend
poetry run uvicorn main:app --host 127.0.0.1 --port 8765
```

Verify that the backend is running:

```bash
curl http://127.0.0.1:8765/openapi.json
```

A JSON response confirms that the backend is running correctly.

---

# Backend Packaging

The Python backend is packaged using PyInstaller.

The packaged backend is used by Tauri as an external sidecar.

## Why `--onedir` is used

The backend uses PyInstaller's `--onedir` mode instead of `--onefile`.

```text
dist/
└── vector-watcher-backend/
    ├── vector-watcher-backend
    └── _internal/
        ├── libpython3.12.dylib
        ├── Python libraries
        ├── native dependencies
        └── other runtime files
```

This is important because the Python executable depends on runtime libraries located inside `_internal`.

A sidecar executable cannot always be copied by itself when using PyInstaller `--onedir`.

For example, the executable may depend on:

```text
_internal/libpython3.12.dylib
```

Copying only:

```text
vector-watcher-backend
```

without its runtime dependencies can result in errors such as:

```text
Failed to load Python shared library
libpython3.12.dylib
```

Therefore, the complete PyInstaller runtime must be preserved when packaging the application.

---

# Backend Build Script

The backend build script detects the current operating system and architecture.

The generated Tauri sidecar must follow the Tauri target naming convention.

Examples:

| Platform | Architecture  | Tauri Sidecar Target        |
| -------- | ------------- | --------------------------- |
| Linux    | x86_64        | `x86_64-unknown-linux-gnu`  |
| Linux    | ARM64         | `aarch64-unknown-linux-gnu` |
| macOS    | Apple Silicon | `aarch64-apple-darwin`      |
| macOS    | Intel         | `x86_64-apple-darwin`       |
| Windows  | x86_64        | `x86_64-pc-windows-msvc`    |

For example, on Apple Silicon:

```text
vector-watcher-backend-aarch64-apple-darwin
```

On Linux x86_64:

```text
vector-watcher-backend-x86_64-unknown-linux-gnu
```

---

# Building the Backend

From the project root:

```bash
cd backend
./build.sh
```

The script should:

1. Detect the operating system.
2. Detect the architecture.
3. Determine the correct Tauri target triple.
4. Clean previous PyInstaller builds.
5. Build the backend with PyInstaller.
6. Prepare the backend runtime for Tauri.
7. Copy the sidecar to:

```text
src-tauri/binaries/
```

---

# Important PyInstaller Command

The PyInstaller command must be written on one command line unless line continuation characters are used.

Correct:

```bash
poetry run pyinstaller \
  --onedir \
  --name "$BACKEND_NAME" \
  --clean \
  server.py
```

Also correct:

```bash
poetry run pyinstaller --onedir --name "$BACKEND_NAME" --clean server.py
```

Incorrect:

```bash
poetry run pyinstaller
--onedir
--name "$BACKEND_NAME"
--clean
server.py
```

The incorrect version causes the shell to execute:

```bash
poetry run pyinstaller
```

without any arguments, resulting in:

```text
pyinstaller: error: the following arguments are required: scriptname
```

Always ensure the command uses either:

* `\` line continuation, or
* one complete line.

---

# Tauri Sidecar Configuration

The production Tauri configuration includes the backend as an external binary.

Example:

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "externalBin": [
      "binaries/vector-watcher-backend"
    ],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

Tauri automatically resolves the correct target-specific sidecar based on the current platform.

For example:

```text
binaries/vector-watcher-backend
```

corresponds to:

```text
binaries/vector-watcher-backend-aarch64-apple-darwin
```

on Apple Silicon.

---

# Starting the Backend Sidecar

The backend is started automatically from Rust.

Development and production use different mechanisms.

## Development

During development, the backend can run directly using Poetry and Uvicorn:

```rust
Command::new("poetry")
    .args([
        "run",
        "uvicorn",
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8765",
    ])
```

This allows local development without packaging the Python backend for every frontend change.

---

## Production

For packaged applications, Tauri starts the PyInstaller sidecar:

```rust
let sidecar_command = app
    .shell()
    .sidecar("vector-watcher-backend")
    .expect("failed to create backend sidecar command");

let (_rx, child) = sidecar_command
    .spawn()
    .expect("failed to start backend");
```

The backend process is stored and terminated when the application exits.

---

# Backend Port

The backend listens on:

```text
127.0.0.1:8765
```

To check whether the backend is running:

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

Example:

```text
vector-wa 55936 user 12u IPv4 ... TCP 127.0.0.1:8765 (LISTEN)
```

To verify the FastAPI backend:

```bash
curl http://127.0.0.1:8765/openapi.json
```

If JSON is returned, the backend is running correctly.

---

# Important Startup Behaviour

The backend sidecar may take a few seconds to start.

Immediately after launching the desktop application:

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

may temporarily return no result.

Wait a few seconds and check again:

```bash
sleep 5
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

The frontend should handle backend startup appropriately and avoid assuming the API is immediately available at the exact moment the Tauri window opens.

---

# Port Already in Use

If the backend fails with:

```text
[Errno 48] address already in use
```

another process is already using port `8765`.

Find the process:

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

Kill it:

```bash
kill <PID>
```

If necessary:

```bash
kill -9 <PID>
```

Then restart Vector Watcher.

---

# Linux Packaging

For Ubuntu and Debian-based distributions, build only the `.deb` package.

## Backend

```bash
cd backend
./build.sh
```

## Tauri Application

From the project root:

```bash
npm run tauri:build:linux
```

Recommended `package.json` script:

```json
{
  "scripts": {
    "tauri:build:linux": "tauri build --config src-tauri/tauri.prod.conf.json --bundles deb"
  }
}
```

The generated package is located at:

```text
src-tauri/target/release/bundle/deb/
```

Example:

```text
Vector Watcher_1.1.0_amd64.deb
```

---

## Install on Ubuntu

```bash
sudo apt install "./src-tauri/target/release/bundle/deb/Vector Watcher_1.1.0_amd64.deb"
```

Or using an absolute path:

```bash
sudo apt install "/home/user/projects/vector-watcher/src-tauri/target/release/bundle/deb/Vector Watcher_1.1.0_amd64.deb"
```

After installation, launch:

```bash
vector-watcher
```

or search for **Vector Watcher** in the Ubuntu application launcher.

---

# macOS Packaging

## Backend

On the target Mac:

```bash
cd backend
./build.sh
```

On Apple Silicon, the backend sidecar target should be:

```text
vector-watcher-backend-aarch64-apple-darwin
```

On Intel:

```text
vector-watcher-backend-x86_64-apple-darwin
```

---

## Build the macOS Application

From the project root:

```bash
npm run tauri:build:mac
```

Recommended script:

```json
{
  "scripts": {
    "tauri:build:mac": "tauri build --config src-tauri/tauri.prod.conf.json --bundles app,dmg"
  }
}
```

Generated outputs:

```text
src-tauri/target/release/bundle/macos/Vector Watcher.app
```

and:

```text
src-tauri/target/release/bundle/dmg/
```

The `.app` can be tested directly.

The `.dmg` is suitable for distribution.

---

# macOS Python Shared Library Issue

If launching the packaged application produces:

```text
Failed to load Python shared library
libpython3.12.dylib
```

the PyInstaller executable was packaged without the complete runtime environment.

The PyInstaller output typically looks like:

```text
dist/vector-watcher-backend/
├── vector-watcher-backend
└── _internal/
    └── libpython3.12.dylib
```

The executable depends on `_internal/libpython3.12.dylib`.

Do not package only the executable without considering the associated PyInstaller runtime.

Always verify the packaged backend before assuming the Tauri frontend is responsible for a `Load failed` error.

---

# Windows Packaging

Windows builds should be performed on Windows or in an appropriate Windows build environment.

## Backend

The backend must be packaged specifically for Windows.

The resulting sidecar should follow the Tauri target convention:

```text
vector-watcher-backend-x86_64-pc-windows-msvc.exe
```

The Linux or macOS PyInstaller executable cannot be reused on Windows.

---

## Build the Windows Installer

Recommended script:

```json
{
  "scripts": {
    "tauri:build:windows": "tauri build --config src-tauri/tauri.prod.conf.json --bundles nsis"
  }
}
```

Run:

```powershell
npm run tauri:build:windows
```

The installer will be generated under:

```text
src-tauri/target/release/bundle/nsis/
```

For MSI instead:

```json
{
  "scripts": {
    "tauri:build:windows": "tauri build --config src-tauri/tauri.prod.conf.json --bundles msi"
  }
}
```

---

# Recommended Build Scripts

A recommended `package.json` configuration:

```json
{
  "scripts": {
    "tauri:build:linux": "tauri build --config src-tauri/tauri.prod.conf.json --bundles deb",

    "tauri:build:mac": "tauri build --config src-tauri/tauri.prod.conf.json --bundles app,dmg",

    "tauri:build:windows": "tauri build --config src-tauri/tauri.prod.conf.json --bundles nsis"
  }
}
```

This avoids generating unnecessary package formats.

---

# Why Not Use `targets: "all"` for Every Build?

Using:

```json
{
  "bundle": {
    "targets": "all"
  }
}
```

can generate multiple installers.

For example, on Linux:

```text
.deb
.rpm
.AppImage
```

Even if only `.deb` is required.

This increases build time.

Prefer explicit bundle targets:

```bash
--bundles deb
```

```bash
--bundles app,dmg
```

```bash
--bundles nsis
```

This keeps builds faster and release artifacts cleaner.

---

# Cleaning Old Build Artifacts

Tauri does not always remove old bundle artifacts when building a different bundle type.

For example, after building only a `.deb`, an old AppImage may still exist:

```text
src-tauri/target/release/bundle/appimage/
```

This does not mean the AppImage was created during the latest build.

Remove old bundle artifacts with:

```bash
rm -rf src-tauri/target/release/bundle
```

Then build the desired package again.

For example:

```bash
npm run tauri:build:linux
```

---

# Complete Release Workflow

## Linux

```bash
cd backend
./build.sh
```

Return to the project root:

```bash
cd ..
npm run tauri:build:linux
```

Install:

```bash
sudo apt install "./src-tauri/target/release/bundle/deb/Vector Watcher_1.1.0_amd64.deb"
```

---

## macOS

```bash
cd backend
./build.sh
```

Return to the project root:

```bash
cd ..
npm run tauri:build:mac
```

The output will contain:

```text
Vector Watcher.app
```

and optionally:

```text
Vector Watcher.dmg
```

---

## Windows

From the backend directory:

```powershell
.\build.ps1
```

or the Windows equivalent backend build script.

Then:

```powershell
npm run tauri:build:windows
```

The installer will be available under:

```text
src-tauri/target/release/bundle/nsis/
```

---

# Troubleshooting

## `Load failed`

This usually means the frontend could not communicate with the backend.

Check whether the backend is running:

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

Then verify the API:

```bash
curl http://127.0.0.1:8765/openapi.json
```

If the API does not respond, investigate the backend sidecar.

---

## Nothing is Listening on Port 8765

Open the application and wait a few seconds.

Then run:

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

If no process appears, verify that:

1. The sidecar exists.
2. The sidecar has executable permissions.
3. The target triple matches the current OS and architecture.
4. PyInstaller runtime files are available.
5. The sidecar can run independently.

---

## Test the Packaged Backend Directly

Run the backend executable directly.

For example:

```bash
./vector-watcher-backend
```

If the backend starts successfully, verify:

```bash
curl http://127.0.0.1:8765/openapi.json
```

If this fails, the issue is in the Python/PyInstaller package rather than the frontend.

---

## `cargo: command not found`

Verify Cargo:

```bash
cargo --version
```

If Cargo is not available, Rust is either not installed or the Cargo binary directory is missing from `PATH`.

Install Rust using Rustup and ensure the Cargo environment is loaded before running:

```bash
npm run tauri:build
```

---

## `address already in use`

Find the existing backend:

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

Kill the process:

```bash
kill <PID>
```

Then restart the application.

---

# Release Checklist

Before creating a release:

```text
[ ] Backend dependencies installed
[ ] Backend build succeeds
[ ] Correct sidecar exists in src-tauri/binaries
[ ] Sidecar target triple matches current platform
[ ] Tauri production build succeeds
[ ] Packaged application launches
[ ] Backend starts automatically
[ ] Port 8765 becomes available
[ ] /openapi.json responds successfully
[ ] Database connection works
[ ] Application closes cleanly
[ ] Backend process stops when application exits
```

---

# Cross-Platform Build Principle

The application source code can be shared across platforms.

However, the packaged binaries cannot.

Each platform requires its own native build:

```text
Linux
  └── Linux PyInstaller backend
      └── Linux Tauri application

macOS
  └── macOS PyInstaller backend
      └── macOS Tauri application

Windows
  └── Windows PyInstaller backend
      └── Windows Tauri application
```

Do not copy a PyInstaller backend built on macOS into a Linux or Windows release.

Do not copy a Linux backend into a macOS release.

Each release must be built for its target operating system and architecture.

---

# License

Add the appropriate license for this project.

For example:

```text
MIT
Apache-2.0
Proprietary
```

depending on the distribution model of Vector Watcher.
