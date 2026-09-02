# Vector Watcher Backend

Backend service for Vector Watcher, built with FastAPI, Uvicorn, and LanceDB.

## Requirements

* Python 3.12+
* Poetry

## Install Dependencies

```bash
poetry install
```

## Run in Development

```bash
poetry run python server.py
```

The backend starts on:

```text
http://127.0.0.1:8765
```

## Build the Backend

The backend is packaged as a standalone Linux executable using PyInstaller.

Run:

```bash
rm -rf build dist
poetry run pyinstaller --onedir --name vector-watcher-backend --clean server.py
```

The generated executable will be located at:

```text
dist/vector-watcher-backend/vector-watcher-backend
```

## Install the Backend Executable

Copy the built executable to `/usr/bin`:

```bash
sudo cp dist/vector-watcher-backend/vector-watcher-backend /usr/bin/vector-watcher-backend
```

Make sure it is executable:

```bash
sudo chmod +x /usr/bin/vector-watcher-backend
```

## Complete Build and Install

For convenience, run the following from the backend directory:

```bash
rm -rf build dist && \
poetry run pyinstaller --onedir --name vector-watcher-backend --clean server.py && \
sudo cp dist/vector-watcher-backend/vector-watcher-backend /usr/bin/vector-watcher-backend && \
sudo chmod +x /usr/bin/vector-watcher-backend
```

## Verify the Installed Backend

```bash
which vector-watcher-backend
```

Expected:

```text
/usr/bin/vector-watcher-backend
```

Check the executable:

```bash
ls -lh /usr/bin/vector-watcher-backend
```

## Verify While Vector Watcher Is Running

Open the Vector Watcher desktop application, then run:

```bash
ps aux | grep '[v]ector-watcher-backend'
```

The backend process should appear while the application is running and disappear after Vector Watcher is closed.

## Build the Desktop Application

From the Vector Watcher project root:

```bash
npm run tauri build -- --bundles deb
```

The generated Debian package is available under:

```text
src-tauri/target/release/bundle/deb/
```

## Reinstall the Latest Debian Package

```bash
sudo apt install --reinstall "src-tauri/target/release/bundle/deb/Vector Watcher_1.1.0_amd64.deb"
```
