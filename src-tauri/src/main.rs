#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri_plugin_stronghold::TauriStronghold;
mod cmd;

fn main() {
  tauri::Builder::default()
    .plugin(TauriStronghold::default())
    .on_page_load(|window, _payload| {
      window.listen("tauri://update-available".to_string(), move |msg| {
        println!("New version available: {:?}", msg);
        });
      })
    .invoke_handler(tauri::generate_handler![
      cmd::detect_os,
      cmd::get_available_space,
      cmd::clone,
      cmd::handleconnection
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
