# Cross Platform Builds

The Vector Watcher source code can be shared across platforms.

The packaged binaries cannot.

Each platform requires its own native build.

---

## Linux

```text
Linux

  └── Linux PyInstaller Backend

      └── Linux Tauri Application
```

## macOS

```text
macOS

  └── macOS PyInstaller Backend

      └── macOS Tauri Application
```

## Windows  

```text
Windows

  └── Windows PyInstaller Backend

      └── Windows Tauri Application
```

### Important Rule

Do not copy a PyInstaller backend built on one platform into another platform's release.

For example:

macOS backend
    ✕
Linux release
Linux backend
    ✕
Windows release

Each release must be built for its target operating system and architecture.

### Sidecar Target Examples

| Platform | Architecture | Target |
| --- | --- | --- |
| Linux | x86_64 | `x86_64-unknown-linux-gnu` |
| Linux | ARM64 | `aarch64-unknown-linux-gnu` |
| macOS | Apple Silicon | `aarch64-apple-darwin` |
| macOS | Intel | `x86_64-apple-darwin` |
| Windows | x86_64 | `x86_64-pc-windows-msvc` |

### Examples

- vector-watcher-backend-aarch64-apple-darwin
- vector-watcher-backend-x86_64-unknown-linux-gnu
- vector-watcher-backend-x86_64-pc-windows-msvc.exe
