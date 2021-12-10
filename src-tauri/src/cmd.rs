use serde::{Deserialize, Serialize};
use tauri::{Window, command};
use std::env;
use std::path::{Path, PathBuf};
use std::io::{self, Write};
use git2::build::{CheckoutBuilder, RepoBuilder};
use git2::{Error, Repository};
use git2::{FetchOptions, Progress, RemoteCallbacks};
use std::cell::RefCell;
use octocrab::{Octocrab};
use octocrab::models::{User, repos::Release};
use semver::{Version};

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

#[derive(Serialize, Debug)]
pub enum AError {
    GHError{ description: String }
}

#[derive(Serialize)]
pub struct GHUser {
    username: String,
    avatar_url: String,
}

impl From<octocrab::Error> for AError {
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
pub async fn handleconnection (token: String) -> Result<GHUser, AError> {
    let octocrab = Octocrab::builder().personal_token(token).build()?;

    let user = ghuser(octocrab.clone());
    if let Ok(value) = user.await {
        let logged_user = GHUser {
            username: value.login,
            avatar_url: value.avatar_url.to_string(),
        };
        //TODO: save credentials
        let latest_remote_release = latest_release(octocrab).await.unwrap();
        let remote_tag = latest_remote_release.tag_name.strip_suffix("-release");
        let remote_version = Version::parse(remote_tag.unwrap());
        if remote_version.unwrap().gt(&localtag(Path::new("F:/UnrealEngine")).unwrap()) {
            println!("update available !!");
            Ok(logged_user)
        }
        else {
            let err = AError::GHError {
                    description: "error".to_string(),
            };
            Err(err)
        }
        //Ok(logged_user)
    }
    else {
        let err = AError::GHError {
            description: "error".to_string(),
        };
        Err(err)
    }
}


pub async fn latest_release(octocrab: Octocrab) -> Result<Release, AError> {
    let release = octocrab.repos("EpicGames", "UnrealEngine")
        .releases()
        .get_latest()
        .await?;

    Ok(release)
}

fn localtag(path: &Path) -> Result<Version, Error> {
    let repo = Repository::open(path)?;

    let mut latest: Version = Version::new(0, 0, 0);
    for name in repo.tag_names(Some("*"))?.iter() {
        let name = name.unwrap();
        let number = name.strip_suffix("-release") .unwrap_or("");
        let version = Some(number).unwrap();
        if version != "" {
            let semversion = Version::parse(version);
            latest = semversion.unwrap().max(latest);
        }
    }

    Ok(latest)
}

async fn ghuser(octocrab: Octocrab) -> Result<User, AError> {
    let user = octocrab
    .current()
    .user()
    .await?;

    Ok(user)
}