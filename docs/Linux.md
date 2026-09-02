# Linux

This page describes building and installing Vector Watcher on Linux.

The current documented target is Ubuntu and Debian-based distributions.

---

## Build the Backend

```bash
cd backend
./build.sh
```

## Build the Tauri Application

From the project root:

```bash
cd ..
cd frontend
npm run tauri:build:linux
```

Recommended *package.json* script:

```json
{
  "scripts": {
    "tauri:build:linux": "cd .. && tauri build --config src-tauri/tauri.prod.conf.json --bundles deb"
  }
}
```

### Generated Package

The package is generated under: *src-tauri/target/release/bundle/deb/*

Example: Vector Watcher_1.1.0_amd64.deb

### Install on Ubuntu

`sudo apt install "./src-tauri/target/release/bundle/deb/Vector Watcher_1.1.0_amd64.deb"`

Or:

```bash
sudo apt install "/absolute/path/to/Vector Watcher_1.1.0_amd64.deb"
```

### Launch

After installation:

`vector-watcher`

You can also launch Vector Watcher from the Ubuntu application launcher.

### Screenshots

📷 Screenshot placeholder: Vector Watcher in Ubuntu application launcher

📷 Screenshot placeholder: Installed Vector Watcher application

📷 Screenshot placeholder: Terminal installation command

### Future Documentation

TODO: Add supported Ubuntu versions.

TODO: Add uninstall instructions.

TODO: Add .deb troubleshooting.

TODO: Add desktop launcher documentation.
