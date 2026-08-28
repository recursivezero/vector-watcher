#!/usr/bin/env bash

set -e

poetry run uvicorn main:app \
  --host 127.0.0.1 \
  --port 8765 \
  --reload