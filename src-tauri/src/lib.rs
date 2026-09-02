use std::{fs, sync::Mutex};

#[cfg(debug_assertions)]
use std::process::{Child, Command};

use tauri::{Manager, RunEvent, WindowEvent};

#[cfg(not(debug_assertions))]
use tauri_plugin_shell::{process::CommandChild, ShellExt};

enum BackendProcess {
    #[cfg(not(debug_assertions))]
    Sidecar(CommandChild),

    #[cfg(debug_assertions)]
    Development(Child),
}

struct BackendState {
    child: Mutex<Option<BackendProcess>>,
}

fn stop_backend(app_handle: &tauri::AppHandle) {
    let backend = {
        let backend_state = app_handle.state::<BackendState>();

        let mut guard = backend_state
            .child
            .lock()
            .expect("failed to lock backend state");

        guard.take()
    };

    if let Some(backend) = backend {
        println!("[Vector Watcher] Stopping backend...");

        match backend {
            #[cfg(not(debug_assertions))]
            BackendProcess::Sidecar(child) => {
                if let Err(error) = child.kill() {
                    eprintln!("[Vector Watcher] Failed to stop backend sidecar: {error}");
                }
            }

            #[cfg(debug_assertions)]
            BackendProcess::Development(mut child) => {
                if let Err(error) = child.kill() {
                    eprintln!("[Vector Watcher] Failed to stop development backend: {error}");
                }
            }
        }
    }
}

#[cfg(debug_assertions)]
fn start_backend(_app: &tauri::App) -> BackendProcess {
    println!("[Vector Watcher] Starting development backend from source...");

    let backend_dir = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../backend");

    let child = Command::new("poetry")
        .args([
            "run",
            "uvicorn",
            "main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8765",
        ])
        .current_dir(backend_dir)
        .spawn()
        .expect("failed to start development backend");

    println!("[Vector Watcher] Development backend started on port 8765");

    BackendProcess::Development(child)
}

#[cfg(not(debug_assertions))]
fn start_backend(app: &tauri::App) -> BackendProcess {
    println!("[Vector Watcher] Starting packaged backend sidecar...");

    let sidecar_command = app
        .shell()
        .sidecar("vector-watcher-backend")
        .expect("failed to create Vector Watcher backend sidecar command");

    let (mut rx, child) = sidecar_command
        .spawn()
        .expect("failed to start Vector Watcher backend");

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                tauri_plugin_shell::process::CommandEvent::Stdout(bytes) => {
                    print!(
                        "[Vector Watcher Backend] {}",
                        String::from_utf8_lossy(&bytes),
                    );
                }

                tauri_plugin_shell::process::CommandEvent::Stderr(bytes) => {
                    eprint!(
                        "[Vector Watcher Backend ERROR] {}",
                        String::from_utf8_lossy(&bytes),
                    );
                }

                other => {
                    println!("[Vector Watcher Backend] {other:?}");
                }
            }
        }
    });

    println!("[Vector Watcher] Backend sidecar started on port 8765");

    BackendProcess::Sidecar(child)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BackendState {
            child: Mutex::new(None),
        })
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path");

            fs::create_dir_all(&app_data_dir).expect("could not create app local data directory");

            let salt_path = app_data_dir.join("salt.txt");

            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            let backend = start_backend(app);

            let backend_state = app.state::<BackendState>();

            *backend_state
                .child
                .lock()
                .expect("failed to lock backend state") = Some(backend);

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                println!("[Vector Watcher] Window close requested");

                stop_backend(&window.app_handle());
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .build(tauri::generate_context!())
        .expect("error while building Tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                println!("[Vector Watcher] Application exiting");

                stop_backend(app_handle);
            }
        });
}
