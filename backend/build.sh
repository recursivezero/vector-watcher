#!/usr/bin/env bash

set -euo pipefail

BACKEND_NAME="vector-watcher-backend"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TAURI_BINARIES_DIR="$PROJECT_ROOT/src-tauri/binaries"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64)
        TARGET_TRIPLE="aarch64-apple-darwin"
        ;;
      x86_64)
        TARGET_TRIPLE="x86_64-apple-darwin"
        ;;
      *)
        echo "ERROR: Unsupported macOS architecture: $ARCH"
        exit 1
        ;;
    esac
    ;;

  Linux)
    case "$ARCH" in
      x86_64)
        TARGET_TRIPLE="x86_64-unknown-linux-gnu"
        ;;
      aarch64)
        TARGET_TRIPLE="aarch64-unknown-linux-gnu"
        ;;
      *)
        echo "ERROR: Unsupported Linux architecture: $ARCH"
        exit 1
        ;;
    esac
    ;;

  *)
    echo "ERROR: Unsupported operating system: $OS"
    exit 1
    ;;
esac

OUTPUT_BINARY_NAME="${BACKEND_NAME}-${TARGET_TRIPLE}"

echo "========================================"
echo " Vector Watcher Backend Build"
echo "========================================"
echo ""
echo "OS: $OS"
echo "Architecture: $ARCH"
echo "Tauri target: $TARGET_TRIPLE"
echo ""

cd "$SCRIPT_DIR"

if [ ! -f "server.py" ]; then
  echo "ERROR: server.py not found in:"
  echo "$SCRIPT_DIR"
  exit 1
fi

echo "Cleaning previous backend build..."

rm -rf build
rm -rf dist

echo ""
echo "Building backend with PyInstaller..."

poetry run pyinstaller \
  --onefile \
  --name "$BACKEND_NAME" \
  --clean \
  server.py

BACKEND_EXECUTABLE="$SCRIPT_DIR/dist/$BACKEND_NAME"

echo ""
echo "Checking PyInstaller output..."
echo "Expected executable:"
echo "$BACKEND_EXECUTABLE"

if [ ! -f "$BACKEND_EXECUTABLE" ]; then
  echo ""
  echo "ERROR: Backend executable was not found."
  echo ""
  echo "Contents of dist:"
  find "$SCRIPT_DIR/dist" -maxdepth 3 -print
  exit 1
fi

echo ""
echo "Creating Tauri binaries directory..."

mkdir -p "$TAURI_BINARIES_DIR"

echo ""
echo "Copying backend sidecar..."

TARGET_BINARY="$TAURI_BINARIES_DIR/$OUTPUT_BINARY_NAME"

rm -f "$TARGET_BINARY"

cp \
  "$BACKEND_EXECUTABLE" \
  "$TARGET_BINARY"

echo ""
echo "Making sidecar executable..."

chmod +x "$TARGET_BINARY"

echo ""
echo "Verifying Tauri sidecar..."

if [ ! -f "$TARGET_BINARY" ]; then
  echo "ERROR: Sidecar was not copied successfully."
  exit 1
fi

ls -lh "$TARGET_BINARY"

echo ""
echo "========================================"
echo " Build completed successfully"
echo "========================================"
echo ""
echo "Tauri sidecar:"
echo "$TARGET_BINARY"