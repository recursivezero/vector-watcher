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

    PYINSTALLER_MODE="onedir"
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

    PYINSTALLER_MODE="onedir"
    ;;

  *)
    echo "ERROR: Unsupported operating system: $OS"
    exit 1
    ;;
esac

OUTPUT_BINARY_NAME="${BACKEND_NAME}-${TARGET_TRIPLE}"
TARGET_BINARY="$TAURI_BINARIES_DIR/$OUTPUT_BINARY_NAME"
TARGET_RUNTIME_DIR="$TAURI_BINARIES_DIR/_internal"

echo "========================================"
echo " Vector Watcher Backend Build"
echo "========================================"
echo ""
echo "OS: $OS"
echo "Architecture: $ARCH"
echo "Tauri target: $TARGET_TRIPLE"
echo "PyInstaller mode: $PYINSTALLER_MODE"
echo ""

cd "$SCRIPT_DIR"

if [ ! -f "server.py" ]; then
  echo "ERROR: server.py not found in: $SCRIPT_DIR"
  exit 1
fi

echo "Cleaning previous backend build..."

rm -rf build
rm -rf dist

echo ""
echo "Building backend with PyInstaller..."

poetry run pyinstaller \
  "--$PYINSTALLER_MODE" \
  --name "$BACKEND_NAME" \
  --clean \
  --exclude-module pytest \
  --exclude-module pyright \
  --exclude-module ruff \
  --exclude-module black \
  server.py

echo ""
echo "Creating Tauri binaries directory..."

mkdir -p "$TAURI_BINARIES_DIR"

echo ""
echo "Cleaning previous Tauri sidecar..."

rm -f "$TARGET_BINARY"
rm -rf "$TARGET_RUNTIME_DIR"

if [ "$PYINSTALLER_MODE" = "onefile" ]; then

  BACKEND_EXECUTABLE="$SCRIPT_DIR/dist/$BACKEND_NAME"

  if [ ! -f "$BACKEND_EXECUTABLE" ]; then
    echo "ERROR: Backend executable was not found: $BACKEND_EXECUTABLE"
    exit 1
  fi

  echo "Copying onefile backend..."

  cp "$BACKEND_EXECUTABLE" "$TARGET_BINARY"

else

  BACKEND_DIR="$SCRIPT_DIR/dist/$BACKEND_NAME"
  BACKEND_EXECUTABLE="$BACKEND_DIR/$BACKEND_NAME"

  if [ ! -f "$BACKEND_EXECUTABLE" ]; then
    echo "ERROR: Backend executable was not found: $BACKEND_EXECUTABLE"
    exit 1
  fi

  if [ ! -d "$BACKEND_DIR/_internal" ]; then
    echo "ERROR: PyInstaller runtime directory was not found."
    exit 1
  fi

  echo "Copying backend executable..."

  cp "$BACKEND_EXECUTABLE" "$TARGET_BINARY"

  echo "Copying PyInstaller runtime..."

  cp -a "$BACKEND_DIR/_internal" "$TARGET_RUNTIME_DIR"

fi

chmod +x "$TARGET_BINARY"

echo ""
echo "Verifying Tauri sidecar..."

if [ ! -f "$TARGET_BINARY" ]; then
  echo "ERROR: Sidecar was not copied successfully."
  exit 1
fi

echo ""
ls -lh "$TARGET_BINARY"

echo ""
echo "Cleaning PyInstaller intermediate files..."

rm -rf "$SCRIPT_DIR/build"

echo "PyInstaller intermediate files cleaned."

if [ "$PYINSTALLER_MODE" = "onedir" ]; then
  echo ""
  echo "PyInstaller runtime:"
  ls -ld "$TARGET_RUNTIME_DIR"
fi

echo ""
echo "========================================"
echo " Build completed successfully"
echo "========================================"
echo ""
echo "Tauri sidecar:"
echo "$TARGET_BINARY"