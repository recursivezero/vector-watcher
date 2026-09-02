
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

## Important Directories

### backend/

Contains the Python backend.

Important files include:

```text
main.py
server.py
pyproject.toml
poetry.lock
build.sh
```

The PyInstaller output is generated inside this area.

#### src

Contains the frontend application source.

TODO: Add frontend architecture documentation.

TODO: Add component structure documentation.

#### src-tauri/

Contains the Tauri and Rust application.

Important areas:

```text
src-tauri/
├── binaries/
├── src/
│   └── lib.rs
├── tauri.conf.json
└── tauri.prod.conf.json
```

#### src-tauri/binaries/

Contains the platform-specific backend sidecar binaries used during production builds.

See [[Backend Sidecar]].
