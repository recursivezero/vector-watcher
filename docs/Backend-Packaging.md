# Backend Packaging

The Python backend is packaged using PyInstaller.

The packaged backend is used by Tauri as an external sidecar.

---

## Why `--onedir` Is Used

The backend uses PyInstaller's `--onedir` mode.

Example output:

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

The executable depends on runtime libraries inside _internal.

A sidecar executable cannot always be copied by itself when using PyInstaller `--onedir`.

For example:

`_internal/libpython3.12.dylib`

Copying only:

`vector-watcher-backend`

without the associated runtime files can produce errors such as:

```bash
Failed to load Python shared library

libpython3.12.dylib
```

Therefore, the complete PyInstaller runtime must be preserved when packaging the application.

### Building the Backend

From the project root:

```bash
cd backend
./build.sh
```

The build script should:

- Detect the operating system.
- Detect the architecture.
- Determine the correct Tauri target triple.
- Clean previous PyInstaller builds.
- Build the backend with PyInstaller.
- Prepare the backend runtime for Tauri.
- Copy the sidecar into src-tauri/binaries/.
- Important PyInstaller Command

Correct multi-line command:

```bash

poetry run pyinstaller \
  --onedir \
  --name "$BACKEND_NAME" \
  --clean \
  server.py
```

Correct single-line command:

`poetry run pyinstaller --onedir --name "$BACKEND_NAME" --clean server.py`

### Related Documentation

[[Backend Sidecar]]
[[Cross Platform Builds]]
[[macOS]]
