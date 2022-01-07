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
  let app = tauri::Builder::default()
    .plugin(TauriStronghold::default())
    .invoke_handler(tauri::generate_handler![
      cmd::pull,
      cmd::detect_os,
      cmd::get_available_space,
      cmd::clone,
      cmd::handleconnection
    ])
    .build(tauri::generate_context!())
    .expect("error while running tauri application");
    let _ = tauri::PackageInfo{
      name: app.package_info().name.to_string(),
      version: app.package_info().version.to_string(),
    };
    app.run(| _, _ | {});

}
