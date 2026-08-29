use std::sync::Mutex;

use tauri::{Manager, RunEvent, WindowEvent};
use tauri_plugin_shell::{process::CommandChild, ShellExt};

struct BackendState {
    child: Mutex<Option<CommandChild>>,
}

fn stop_backend(app_handle: &tauri::AppHandle) {
    let child = {
        let backend_state = app_handle.state::<BackendState>();

        let mut guard = backend_state
            .child
            .lock()
            .expect("failed to lock backend state");

        let child = guard.take();

        drop(guard);

        child
    };

    if let Some(child) = child {
        println!("[Vector Watcher] Stopping backend sidecar...");

        if let Err(error) = child.kill() {
            eprintln!("[Vector Watcher] Failed to stop backend sidecar: {error}");
        } else {
            println!("[Vector Watcher] Backend sidecar stopped successfully");
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BackendState {
            child: Mutex::new(None),
        })
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path")
                .join("salt.txt");

            app.handle()
                .plugin(
                    tauri_plugin_stronghold::Builder::with_argon2(&salt_path)
                        .build(),
                )?;

            println!("[Vector Watcher] Starting backend sidecar...");

            let sidecar_command = app
                .shell()
                .sidecar("vector-watcher-backend")
                .expect("failed to create Vector Watcher backend sidecar command");

            let (_rx, child) = sidecar_command
                .spawn()
                .expect("failed to start Vector Watcher backend");

            let backend_state = app.state::<BackendState>();

            *backend_state
                .child
                .lock()
                .expect("failed to lock backend state") = Some(child);

            println!("[Vector Watcher] Backend sidecar started on port 8765");

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