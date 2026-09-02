# Vector Watcher

A modern, cross-platform desktop GUI for exploring and managing LanceDB vector databases.

<p align="center">
  <img src="docs/screenshots/vector-watcher.png" alt="Vector Watcher - Cross-platform LanceDB GUI" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/recursivezero/vector-watcher/releases"><img src="https://badgen.net/github/releases/recursivezero/vector-watcher" alt="Latest Release"></a>
  <a href="https://github.com/recursivezero/vector-watcher/blob/main/LICENSE"><img src="https://badgen.net/github/license/recursivezero/vector-watcher" alt="License"></a>
</p>

---

## Overview

**Vector Watcher** simplifies working with local and remote vector embeddings. Built on top of **Tauri**, **React**, **TypeScript**, and a sidecar **Python/FastAPI** engine, it provides a light, responsive interface for vector inspection, similarity searches, and table management without memory overhead.

### Key Features

- **Connection Manager:** Configure, persist, and quickly switch between multiple local or remote LanceDB instances.
- **Schema & Table Inspector:** Browse vector datasets, structural schemas, metadata, and row counts seamlessly.
- **Vector Similarity Search:** Execute distance queries (L2, Cosine, Dot Product) directly from the interface.
- **Zero-Setup Sidecar:** Auto-managed local PyPI Python sidecar running over an isolated internal loopback socket (`127.0.0.1:8765`).

---

## Architecture

Vector Watcher uses Tauri to launch an isolated Python backend as a sidecar binary, bridging low-latency IPC with high-performance vector calculations:

```text
┌─────────────────────────────────────────────────────────┐
│ React / TypeScript (Tauri Webview Core)                 │
└────────────────────────────┬────────────────────────────┘
                             │ Local Webview IPC
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Tauri Native Host (Rust Core Engine)                    │
└────────────────────────────┬────────────────────────────┘
                             │ Manages Sidecar Process
                             ▼
┌─────────────────────────────────────────────────────────┐
│ Python / FastAPI Engine (Uvicorn Sidecar)               │
│ Bound locally to: [http://127.0.0.1:8765](http://127.0.0.1:8765)                 │
└────────────────────────────┬────────────────────────────┘
                             │ Native Bindings
                             ▼
┌─────────────────────────────────────────────────────────┐
│ LanceDB Core (v0.30.2 Vector Index / Storage)           │
└─────────────────────────────────────────────────────────┘

```

---

## Installation

Download the pre-compiled binary for your environment from the **[Releases Page](https://github.com/recursivezero/vector-watcher/releases)**:

| OS Platform               | Target Arch           | Package Format       |
| ------------------------- | --------------------- | -------------------- |
| **Linux** (Ubuntu 24.04+) | `x86_64` / `arm64`    | `.AppImage`, `.deb`  |
| **macOS**                 | Apple Silicon / Intel | `.dmg`               |
| **Windows** (Windows 11)  | `x64`                 | `.msi`, Setup `.exe` |

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ LTS recommended)
- [Rust](https://www.rust-lang.org/) (latest stable toolchain for Tauri)
- [Python](https://www.python.org/) (v3.11+) with [Poetry](https://python-poetry.org/)

### Monorepo Setup

1. **Clone the repository:**

```bash
git clone https://github.com/recursivezero/vector-watcher.git
cd vector-watcher
```

2. **Setup Frontend:**

```bash
cd frontend
npm install

```

3. **Setup Python Sidecar:**

```bash
cd backend
poetry install --all-extras --with dev

```

4. **Run Dev Environment:**

```bash
cd frontend
npm run tauri:dev
```

---

## Build Targets

To package standalone installers for production manually:

```bash
cd frontend
npm run tauri:build:[mac|linux|windows]
```

_For detailed platform-specific compilation instructions, consult the [Platform Build Guides](https://github.com/recursivezero/vector-watcher/wiki/Cross-Platform-Builds)._

---

## Documentation & Wiki

For detailed guides, API schemas, and release strategies, visit the **[GitHub Wiki](https://github.com/recursivezero/vector-watcher/wiki)**:

- 📘 [User Guide & Operations](https://github.com/recursivezero/vector-watcher/wiki/Getting-Started)
- 🛠️ [Architecture & FastAPI Protocol](https://github.com/recursivezero/vector-watcher/wiki/Architecture)
- 📦 [Packaging & Binary Sidecar Workflow](https://github.com/recursivezero/vector-watcher/wiki/Backend-Sidecar)

---

## Contributing

Created and maintained by

- [Keshav Mohta](https://github.com/xkeshav)

- [Dhwani Khandelwal](https://github.com/DhwaniKhandelwal-tech)

Contributions are welcome! Please open an issue or pull request to start a discussion.

---

## License

Distributed under the [MIT License](/LICENSE).
