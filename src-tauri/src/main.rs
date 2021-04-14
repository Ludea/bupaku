#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod cmd;

fn main() {
  tauri::Builder::default()
    .on_page_load(|window, _payload| {
      window.listen("tauri://update-available".to_string(), move |msg| {
        println!("New version available: {:?}", msg);
      });
    })
    .invoke_handler(tauri::generate_handler![
      cmd::detect_os,
      cmd::get_available_space
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
