#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri_plugin_stronghold::TauriStronghold;
use tauri::{Manager};
mod cmd;

fn main() {
  tauri::Builder::default()
    .plugin(TauriStronghold::default())
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();       
      main_window.listen("tauri://update-available".to_string(), move |msg| {
        println!("New version available: {:?}", msg);
        });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      cmd::pull,
      cmd::detect_os,
      cmd::get_available_space,
      cmd::clone,
      cmd::handleconnection
    ])
    .plugin(TauriStronghold::default())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
