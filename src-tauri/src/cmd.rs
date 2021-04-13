use tauri::command;
use std::env;
use std::path::Path;

#[command]
pub fn detect_os() -> &'static str {
    return env::consts::OS ;
}

#[command]
pub fn get_available_space(path: String) -> Result<u64, std::string::String>  {
    return fs2::available_space(Path::new(&path))
    .map_err(|e| e.to_string());
}