# Troubleshooting

This page contains common Vector Watcher build and runtime issues.

---

## Common Issues

### load failed

This usually means the frontend could not communicate with the backend.

Check whether the backend is running:

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN

# Then verify the API:

curl http://127.0.0.1:8765/openapi.json
```

If the API does not respond, investigate the backend sidecar.

Nothing Is Listening on Port 8765

Open the application and wait a few seconds.

Then run:

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

Verify:

- The sidecar exists.
- The sidecar has executable permissions.
- The target triple matches the current OS and architecture.
- PyInstaller runtime files are available.
- The sidecar can run independently.
- Test the Packaged Backend Directly

Run:

`./vector-watcher-backend`

Then verify:

`curl http://127.0.0.1:8765/openapi.json`

If this fails, the problem is in the Python/PyInstaller package rather than the frontend.

### cargo: command not found

Verify Cargo:

`cargo --version`

If Cargo is unavailable, Rust may not be installed or the Cargo binary directory may not be available in PATH.

Install Rust using Rustup and ensure the Cargo environment is loaded.

### address already in use

Find the process:

`lsof -nP -iTCP:8765 -sTCP:LISTEN`

Stop it:

`kill <PID>`

Then restart Vector Watcher.

### Python Shared Library Error

Example:

Failed to load Python shared library libpython3.12.dylib

Verify that the PyInstaller `\_internal` directory is available together with the executable.

See More at

- [Backend Packaging](./Backend-Packaging.md)
- [macOS](./macOS.md)
