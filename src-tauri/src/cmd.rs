use serde::{Deserialize, Serialize};
use tauri::{Window, command};
use std::env;
use std::path::{Path, PathBuf};
use std::io::{self, Write};
use git2::build::{CheckoutBuilder, RepoBuilder};
use git2::{FetchOptions, Progress, RemoteCallbacks};
use std::cell::RefCell;
use octocrab::Octocrab;

#[derive(Deserialize)]
pub struct Args {
    arg_url: String,
    arg_path: String,
}

#[derive(Clone, Serialize)]
struct Payload {
  network_pct: usize,
  received_objects: usize,
  total_objects: usize,
  indexed_deltas: usize,
  total_deltas: usize,
  size: usize,
}

#[derive(Serialize)]
pub enum Error {
    GHError{ description: String }
}

impl From<octocrab::Error> for Error {
    fn from(error: octocrab::Error) -> Self {
        Self::GHError { description: error.to_string() }
    }
}

struct State {
    progress: Option<Progress<'static>>,
    total: usize,
    current: usize,
    path: Option<PathBuf>,
    newline: bool,
}

#[command]
pub fn detect_os() -> &'static str {
    return env::consts::OS ;
}

#[command]
pub fn get_available_space(path: String) -> Result<u64, std::string::String>  {
    return fs2::available_space(Path::new(&path))
    .map_err(|e| e.to_string());
}

fn print(state: &mut State) {
    let stats = state.progress.as_ref().unwrap();
    let network_pct = (100 * stats.received_objects()) / stats.total_objects();
    let index_pct = (100 * stats.indexed_objects()) / stats.total_objects();
    let co_pct = if state.total > 0 {
        (100 * state.current) / state.total
    } else {
        0
    };
    let kbytes = stats.received_bytes() / 1024;
    if stats.received_objects() == stats.total_objects() {
        if !state.newline {
            println!();
            state.newline = true;
        }
        print!(
            "Resolving deltas {}/{}\r",
            stats.indexed_deltas(),
            stats.total_deltas()
        );
    } else {
        print!(
            "net {:3}% ({:4} kb, {:5}/{:5})  /  idx {:3}% ({:5}/{:5})  \
             /  chk {:3}% ({:4}/{:4}) {}\r",
            network_pct,
            kbytes,
            stats.received_objects(),
            stats.total_objects(),
            index_pct,
            stats.indexed_objects(),
            stats.total_objects(),
            co_pct,
            state.current,
            state.total,
            state
                .path
                .as_ref()
                .map(|s| s.to_string_lossy().into_owned())
                .unwrap_or_default()
        )
    }
    io::stdout().flush().unwrap();
}

#[command]
pub fn clone(args: Args, window: Window) {
    let state = RefCell::new(State {
        progress: None,
        total: 0,
        current: 0,
        path: None,
        newline: false,
    });
    let mut cb = RemoteCallbacks::new();
    cb.transfer_progress(|stats| {
        let mut state = state.borrow_mut();
        state.progress = Some(stats.to_owned());
        let progress = state.progress.as_ref().unwrap();
        let network_pct = (100 * progress.received_objects()) / progress.total_objects();
        let kbytes = progress.received_bytes() / 1024;
        window.emit("objects", Payload { network_pct: network_pct, received_objects: stats.received_objects(), total_objects: stats.total_objects(), size: kbytes, indexed_deltas: 0, total_deltas: 0 }).unwrap();
        print(&mut *state);
        true
    });

    let mut co = CheckoutBuilder::new();
    co.progress(|path, cur, total| {
        let mut state = state.borrow_mut();
        state.path = path.map(|p| p.to_path_buf());
        state.current = cur;
        state.total = total;
        print(&mut *state);
    });

    let mut fo = FetchOptions::new();
    fo.remote_callbacks(cb);
    RepoBuilder::new()
        .fetch_options(fo)
        .with_checkout(co)
        .clone(&args.arg_url, Path::new(&args.arg_path));
    println!();

   // Ok(())
}

#[command]
pub async fn getuerepopermission(token: String) -> Result<(), Error> {
    let octocrab = Octocrab::builder().personal_token(token).build()?;

    let repo = octocrab.repos("rust-lang", "rust").get().await?;

    println!(
        "{} has {} stars",
        repo.full_name.unwrap(),
        repo.stargazers_count.unwrap_or(0)
    );

    Ok(())
}
