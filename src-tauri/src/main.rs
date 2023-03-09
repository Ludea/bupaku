#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use rand::distributions::{Alphanumeric, DistString};

mod cmd;

#[derive(serde::Serialize)]
struct Payload {
  version: String,
  date: String,
  body: String 
}

fn main() {
  tauri::Builder::default()
  .plugin(
    tauri_plugin_stronghold::Builder::new(|password| {
      let config = argon2::Config {
        lanes: 2,
        mem_cost: 50_000,
        time_cost: 30,
        thread_mode: argon2::ThreadMode::from_threads(2),
        variant: argon2::Variant::Argon2id,
        ..Default::default()
      };

      let salt = Alphanumeric.sample_string(&mut rand::thread_rng(), 12);
      let key = argon2::hash_raw(password.as_ref(), salt.as_bytes(), &config)
        .expect("failed to hash password");

      key.to_vec()
    })
    .build(),
  )
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
