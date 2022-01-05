#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri_plugin_stronghold::TauriStronghold;

mod cmd;

#[derive(serde::Serialize)]
struct Payload {
  version: String,
  date: String,
  body: String 
}

fn main() {
  tauri::Builder::default()
    .plugin(TauriStronghold::default())
    .invoke_handler(tauri::generate_handler![
      cmd::pull,
      cmd::detect_os,
      cmd::get_available_space,
      cmd::clone,
      cmd::handleconnection
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
