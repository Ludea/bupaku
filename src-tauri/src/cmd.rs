use tauri::command;
use std::env;

#[command]
pub fn detect_os() -> &'static str {
    return env::consts::OS ;
}