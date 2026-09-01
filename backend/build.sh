#!/usr/bin/env bash

set -euo pipefail

BACKEND_NAME="vector-watcher-backend"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TAURI_BINARIES_DIR="$PROJECT_ROOT/src-tauri/binaries"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS:$ARCH" in
  Darwin:arm64)
    TARGET_TRIPLE="aarch64-apple-darwin"
    ;;
  Darwin:x86_64)
    TARGET_TRIPLE="x86_64-apple-darwin"
    ;;
  Linux:x86_64)
    TARGET_TRIPLE="x86_64-unknown-linux-gnu"
    ;;
  Linux:aarch64)
    TARGET_TRIPLE="aarch64-unknown-linux-gnu"
    ;;
  *)
    echo "ERROR: Unsupported platform: $OS / $ARCH"
    exit 1
    ;;
esac

OUTPUT_BINARY="$BACKEND_NAME-$TARGET_TRIPLE"

echo "Building $BACKEND_NAME for $TARGET_TRIPLE..."

cd "$SCRIPT_DIR"

[ -f server.py ] || {
  echo "ERROR: server.py not found"
  exit 1
}

rm -rf build dist

poetry run pyinstaller \
  --onedir \
  --name "$BACKEND_NAME" \
  --clean \
  --exclude-module pytest \
  --exclude-module pyright \
  --exclude-module ruff \
  --exclude-module black \
  server.py

BACKEND_DIR="$SCRIPT_DIR/dist/$BACKEND_NAME"
BACKEND_EXECUTABLE="$BACKEND_DIR/$BACKEND_NAME"

[ -f "$BACKEND_EXECUTABLE" ] || {
  echo "ERROR: Backend executable was not created"
  find "$SCRIPT_DIR/dist" -maxdepth 3 -print
  exit 1
}

mkdir -p "$TAURI_BINARIES_DIR"

TARGET_BINARY="$TAURI_BINARIES_DIR/$OUTPUT_BINARY"
TARGET_RUNTIME_DIR="$TAURI_BINARIES_DIR/_internal"

rm -f "$TARGET_BINARY"
rm -rf "$TARGET_RUNTIME_DIR"

cp "$BACKEND_EXECUTABLE" "$TARGET_BINARY"
cp -a "$BACKEND_DIR/_internal" "$TARGET_RUNTIME_DIR"

chmod +x "$TARGET_BINARY"

[ -f "$TARGET_BINARY" ] || {
  echo "ERROR: Sidecar was not copied"
  exit 1
}

[ -d "$TARGET_RUNTIME_DIR" ] || {
  echo "ERROR: PyInstaller runtime was not copied"
  exit 1
}

echo ""
echo "Build completed successfully"
echo "Target: $TARGET_TRIPLE"
echo "Sidecar: $TARGET_BINARY"
echo "Runtime: $TARGET_RUNTIME_DIR"