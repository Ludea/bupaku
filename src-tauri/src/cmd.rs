use serde::{Deserialize, Serialize};
use tauri::{Window, command};
use std::env;
use std::path::{Path, PathBuf};
use std::{time::Duration};
use git2::build::{CheckoutBuilder, RepoBuilder};
use git2::{Error, Repository};
use git2::{FetchOptions, Progress, RemoteCallbacks, Cred};
use octocrab::{Octocrab};
use octocrab::models::{User, repos::Release};
use semver::{Version};
use tauri_plugin_stronghold::stronghold;
use iota_stronghold::{
    Location, StrongholdFlags };


#[derive(Clone)]
pub struct Vault {
    name: String,
    flags: Vec<StrongholdFlags>,
}

#[derive(Deserialize)]
pub struct Args {
    arg_url: String,
    arg_path: String,
    arg_tag: String,
}

#[derive(Clone, Serialize)]
struct ObjectPayload {
  network_pct: usize,
  received_objects: usize,
  total_objects: usize,
  indexed_objects: usize,
  indexed_deltas: usize,
  total_deltas: usize,
  size: usize,
}

#[derive(Clone, Serialize)]
struct UpdatePayload {
  version: String,
}

#[derive(Clone, Serialize)]
struct ClonePayload {
  isfinished: bool,
}

#[derive(Serialize, Debug)]
pub enum AError {
    GHError{ description: String }
}

#[derive(Serialize, Debug)]
pub enum Giterror {
    Giterror{ description: String }
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

impl From<git2::Error> for Giterror {
    fn from(error: git2::Error) -> Self {
        Self::Giterror { description: error.to_string() }
    }
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

#[command]
pub async fn clone(args: Args, window: Window) -> Result<(), Giterror> {

    let snapshot_path = PathBuf::from("./.bupaku");
    let vault: Vault = Vault{name: "BupakuStore".to_string(), flags: vec![] };
    let username_location: Location = Location::generic("username", "username");
    let pat_location: Location = Location::generic("pat", "pat");

    let username = get_value(snapshot_path.clone(), vault.clone(), username_location).await.unwrap();
    let pat = get_value(snapshot_path.clone(), vault.clone(), pat_location).await.unwrap();
    
    let mut cb = RemoteCallbacks::new();
    cb.credentials(|_, _, _| {
        Cred::userpass_plaintext(&username, &pat)
    });

    cb.transfer_progress(|stats| {
        window.emit("objects", ObjectPayload { 
            network_pct: (100 * stats.received_objects()) / stats.total_objects(), 
            received_objects: stats.received_objects(), 
            total_objects: stats.total_objects(), 
            indexed_objects: stats.indexed_objects(),
            size: stats.received_bytes() / 1024, 
            indexed_deltas: 0, 
            total_deltas: 0 })
            .unwrap();
        true
    });

    let mut co = CheckoutBuilder::new();
    co.progress(|_, current, total| {
        window.emit("deltas", ObjectPayload{
            network_pct: 0,
            received_objects: 0,
            total_objects: 0,
            indexed_objects: 0,
            size: 0,
            indexed_deltas: current,
            total_deltas: total,
        }).unwrap();
    });

    let mut fo = FetchOptions::new();
    fo.remote_callbacks(cb);
    let local_repo = RepoBuilder::new()
        .fetch_options(fo)
        .with_checkout(co)
        .clone(&args.arg_url, Path::new(&args.arg_path))?;

    checkout(local_repo, &args.arg_tag)?;
    window.emit("finish", ClonePayload{isfinished: true}).unwrap();
    Ok(())
}

fn checkout (repo: Repository, refname: &str) -> Result<(), Giterror> {
    let (object, reference) = repo.revparse_ext(refname)?;
    repo.checkout_tree(&object, None)?;

    match reference {
        Some(gref) => repo.set_head(gref.name().unwrap())?,
        None => repo.set_head_detached(object.id())?
    }

    Ok(())
}

fn do_fetch<'a> (
    repo: &'a git2::Repository,
    refs: &[&str],
    remote: &'a mut git2::Remote,
    window: Window,
    username: String,
    pat: String
) -> Result<git2::AnnotatedCommit<'a>, git2::Error> {
    let mut cb = git2::RemoteCallbacks::new();

    cb.credentials(|_, _, _| {
        Cred::userpass_plaintext(&username, &pat)
    });

    // Print out our transfer progress.
    cb.transfer_progress(|stats| {
        if stats.received_objects() == stats.total_objects() {
            window.emit("deltas_fetch", ObjectPayload {
                network_pct: 0,
                received_objects: 0,
                total_objects: 0,
                indexed_objects: 0,
                indexed_deltas: stats.indexed_deltas(),
                total_deltas: stats.total_deltas(),
                size: 0,
            }).unwrap();
        } else if stats.total_objects() > 0 {
            window.emit("object_fetch", ObjectPayload { 
                network_pct: 0,
                received_objects: stats.received_objects(), 
                total_objects: stats.total_objects(), 
                indexed_objects: stats.indexed_objects(),
                indexed_deltas: 0,
                total_deltas: 0,
                size: stats.received_bytes()
            }).unwrap();
        }
        true
    });

    let mut fo = git2::FetchOptions::new();
    fo.remote_callbacks(cb);
    // Always fetch all tags.
    // Perform a download and also update tips
    fo.download_tags(git2::AutotagOption::All);
    println!("Fetching {} for repo", remote.name().unwrap());
    remote.fetch(refs, Some(&mut fo), None)?;

    // If there are local objects (we got a thin pack), then tell the user
    // how many objects we saved from having to cross the network.
    let stats = remote.stats();
    if stats.local_objects() > 0 {
        println!(
            "\rReceived {}/{} objects in {} bytes (used {} local \
             objects)",
            stats.indexed_objects(),
            stats.total_objects(),
            stats.received_bytes(),
            stats.local_objects()
        );
    } else {
        println!(
            "\rReceived {}/{} objects in {} bytes",
            stats.indexed_objects(),
            stats.total_objects(),
            stats.received_bytes()
        );
    }

    let fetch_head = repo.find_reference("FETCH_HEAD")?;
    Ok(repo.reference_to_annotated_commit(&fetch_head)?)
}

fn normal_merge(
    repo: &Repository,
    local: &git2::AnnotatedCommit,
    remote: &git2::AnnotatedCommit,
) -> Result<(), git2::Error> {
    let local_tree = repo.find_commit(local.id())?.tree()?;
    let remote_tree = repo.find_commit(remote.id())?.tree()?;
    let ancestor = repo
        .find_commit(repo.merge_base(local.id(), remote.id())?)?
        .tree()?;
    let mut idx = repo.merge_trees(&ancestor, &local_tree, &remote_tree, None)?;

    if idx.has_conflicts() {
        println!("Merge conficts detected...");
        repo.checkout_index(Some(&mut idx), None)?;
        return Ok(());
    }
    let result_tree = repo.find_tree(idx.write_tree_to(repo)?)?;
    // now create the merge commit
    let msg = format!("Merge: {} into {}", remote.id(), local.id());
    let sig = repo.signature()?;
    let local_commit = repo.find_commit(local.id())?;
    let remote_commit = repo.find_commit(remote.id())?;
    // Do our merge commit and set current branch head to that commit.
    let _merge_commit = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &msg,
        &result_tree,
        &[&local_commit, &remote_commit],
    )?;
    // Set working tree to match head.
    repo.checkout_head(None)?;
    Ok(())
}

fn fast_forward(
    repo: &Repository,
    lb: &mut git2::Reference,
    rc: &git2::AnnotatedCommit,
) -> Result<(), git2::Error> {
    let name = match lb.name() {
        Some(s) => s.to_string(),
        None => String::from_utf8_lossy(lb.name_bytes()).to_string(),
    };
    let msg = format!("Fast-Forward: Setting {} to id: {}", name, rc.id());
    println!("{}", msg);
    lb.set_target(rc.id(), &msg)?;
    repo.set_head(&name)?;
    repo.checkout_head(Some(
        git2::build::CheckoutBuilder::default()
            // For some reason the force is required to make the working directory actually get updated
            // I suspect we should be adding some logic to handle dirty working directory states
            // but this is just an example so maybe not.
            .force(),
    ))?;
    Ok(())
}

fn do_merge<'a>(
    repo: &'a Repository,
    remote_branch: &str,
    fetch_commit: git2::AnnotatedCommit<'a>,
) -> Result<(), Giterror> {
    // 1. do a merge analysis
    let analysis = repo.merge_analysis(&[&fetch_commit])?;

    // 2. Do the appopriate merge
    if analysis.0.is_fast_forward() {
        println!("Doing a fast forward");
        // do a fast forward
        let refname = format!("refs/heads/{}", remote_branch);
        match repo.find_reference(&refname) {
            Ok(mut r) => {
                fast_forward(repo, &mut r, &fetch_commit)?;
            }
            Err(_) => {
                // The branch doesn't exist so just set the reference to the
                // commit directly. Usually this is because you are pulling
                // into an empty repository.
                repo.reference(
                    &refname,
                    fetch_commit.id(),
                    true,
                    &format!("Setting {} to {}", remote_branch, fetch_commit.id()),
                )?;
                repo.set_head(&refname)?;
                repo.checkout_head(Some(
                    git2::build::CheckoutBuilder::default()
                        .allow_conflicts(true)
                        .conflict_style_merge(true)
                        .force(),
                ))?;
            }
        };
    } else if analysis.0.is_normal() {
        // do a normal merge
        let head_commit = repo.reference_to_annotated_commit(&repo.head()?)?;
        normal_merge(&repo, &head_commit, &fetch_commit)?;
    } else {
        println!("Nothing to do...");
    }
    Ok(())
}

#[command]
pub async fn pull(window: Window, path: String) -> Result<(), Giterror> {
    let repo: Repository = Repository::open(Path::new(&path)).unwrap();
    let refs = "4.27.2-release";
   
    let snapshot_path = PathBuf::from("./.bupaku");
    let vault: Vault = Vault{name: "BupakuStore".to_string(), flags: vec![]};
    let username_location: Location = Location::generic("username", "username");
    let pat_location: Location = Location::generic("pat", "pat");

    let username = get_value(snapshot_path.clone(), vault.clone(), username_location).await.unwrap();
    let pat = get_value(snapshot_path.clone(), vault.clone(), pat_location).await.unwrap();

    let mut remote = repo.find_remote("origin")?;
    
    let fetch_commit = do_fetch(&repo, &[refs], &mut remote, window, username, pat)?;
    do_merge(&repo, &refs, fetch_commit)
    //checkout(repo, &refs)
}

#[command]
pub async fn handleconnection (token: String, window: Window) -> Result<String, AError> {
    let octocrab = Octocrab::builder().personal_token(token.clone()).build()?;

    let user = ghuser(octocrab.clone());
    if let Ok(value) = user.await {
        let avatar_url = value.avatar_url.to_string();
        let snapshot_path: PathBuf = PathBuf::from("./.bupaku");
        let vault: Vault = Vault {name: "BupakuStore".to_string(), flags: vec![] };
        let username_location: Location = Location::generic("username", "username");
        let pat_location: Location = Location::generic("pat", "pat");
        save_value(snapshot_path.clone(), vault.clone(), username_location, value.login, None).await.unwrap();
        save_value(snapshot_path, vault, pat_location, token, None).await.unwrap();
        
        let latest_remote_release = latest_release(octocrab).await.unwrap();
        let remote_tag = latest_remote_release.tag_name.strip_suffix("-release");
        let remote_version = Version::parse(remote_tag.unwrap());
        if remote_version.as_ref().unwrap().gt(&localtag(Path::new("F:/UnrealEngine")).unwrap()) {
            window.emit("update", UpdatePayload { version: remote_version.unwrap().to_string()}).unwrap();
        }
        Ok(avatar_url)
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
    let local_tag = repo.describe(&git2::DescribeOptions::new()).unwrap();
    let describe = local_tag.format(Some(&git2::DescribeFormatOptions::new())).unwrap();
    let version_as_string = describe.strip_suffix("-release");
    let semver = Version::parse(version_as_string.unwrap());
    Ok(semver.unwrap())
}

async fn ghuser(octocrab: Octocrab) -> Result<User, AError> {
    let user = octocrab
    .current()
    .user()
    .await?;
    Ok(user)
}

async fn save_value(
    snapshot_path: PathBuf, 
    vault: Vault,
    location: Location, 
    record: String, 
    lifetime: Option<Duration>
  ) -> Result<(), tauri_plugin_stronghold::stronghold::Error> {
        let api = stronghold::Api::new(snapshot_path.clone());
        let store = api.get_store(vault.name, vault.flags);
        store.save_record(location.into(), record, lifetime).await?;
        Ok(())
}

pub async fn get_value(
    snapshot_path: PathBuf,
    vault: Vault,
    location: Location,
  ) -> Result<String, tauri_plugin_stronghold::stronghold::Error> {
        let api = stronghold::Api::new(&snapshot_path);
        let store: stronghold::Store = api.get_store(vault.name, vault.flags);
        let record = store.get_record(location.into()).await?;
        Ok(record)
}

