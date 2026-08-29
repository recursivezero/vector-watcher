#!/usr/bin/env bash

set -e

BACKEND_NAME="vector-watcher-backend"
INSTALL_DIR="/opt/$BACKEND_NAME"

echo "Cleaning previous build..."
rm -rf build dist "$INSTALL_DIR"

echo "Building backend..."
poetry run pyinstaller \
  --onedir \
  --name "$BACKEND_NAME" \
  --clean \
  server.py

echo "Installing backend..."
sudo mkdir -p "$INSTALL_DIR"
sudo cp -a "dist/$BACKEND_NAME/." "$INSTALL_DIR/"

echo "Backend installed successfully:"
echo "$INSTALL_DIR/$BACKEND_NAME"