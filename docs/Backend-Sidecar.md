
# Backend Sidecar

The Python backend is packaged as a native executable and launched by Tauri as an external sidecar.

---

## Tauri Sidecar Configuration

The production configuration includes the backend as an external binary.

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

Tauri resolves the correct target-specific sidecar for the current platform.

For example:

binaries/vector-watcher-backend

may correspond to:

binaries/vector-watcher-backend-aarch64-apple-darwin

on Apple Silicon.

## Starting the Backend

Development and production use different mechanisms.

### Development

During development, the backend can run directly using Poetry and Uvicorn.

```rs
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

This allows frontend development without rebuilding the PyInstaller backend for every change.

### Production

For packaged applications, Tauri starts the PyInstaller sidecar.

```rs
let sidecar_command = app
    .shell()
    .sidecar("vector-watcher-backend")
    .expect("failed to create backend sidecar command");

let (_rx, child) = sidecar_command
    .spawn()
    .expect("failed to start backend");
```

The backend process is stored and terminated when the application exits.

### Backend Port

The backend listens on:

127.0.0.1:8765

Check the process:

`lsof -nP -iTCP:8765 -sTCP:LISTEN`

Verify the API:

`curl http://127.0.0.1:8765/openapi.json`

### Startup Behavior

The backend sidecar may take a few seconds to start.

Immediately after launching the application:

`lsof -nP -iTCP:8765 -sTCP:LISTEN`

may temporarily return no result.

Wait and retry:

```bash
sleep 5
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

The frontend should not assume that the backend is immediately available when the Tauri window opens.

#### Port Already in Use

Find the process:

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

Stop it:

```bash
kill <PID>
```

If necessary:

```bash

kill -9 <PID>
```

Then restart Vector Watcher.
