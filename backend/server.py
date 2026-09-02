import time

START_TIME = time.perf_counter()

print(
    "[Vector Watcher Backend] Starting process...",
    flush=True,
)

import uvicorn

print(
    "[Vector Watcher Backend] Uvicorn imported "
    f"after {time.perf_counter() - START_TIME:.2f}s",
    flush=True,
)

from main import app

print(
    "[Vector Watcher Backend] Application imported "
    f"after {time.perf_counter() - START_TIME:.2f}s",
    flush=True,
)

if __name__ == "__main__":
    print(
        "[Vector Watcher Backend] Starting Uvicorn "
        f"after {time.perf_counter() - START_TIME:.2f}s",
        flush=True,
    )

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8765,
        log_level="info",
    )
