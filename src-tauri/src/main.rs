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
        window.listen("update".to_string(), move |_| {
          tauri::async_runtime::spawn(cmd::pull());          
         });
      })
    .invoke_handler(tauri::generate_handler![
      cmd::detect_os,
      cmd::get_available_space,
      cmd::clone,
      cmd::handleconnection
    ])
    .plugin(TauriStronghold::default())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
