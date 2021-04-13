#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod cmd;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      cmd::detect_os,
      cmd::get_available_space
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
