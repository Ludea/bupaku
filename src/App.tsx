import React, { useState, useRef, useEffect, forwardRef, SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import Badge from '@mui/material/Badge';
import Snackbar from '@mui/material/Snackbar';
import FormLabel  from '@mui/material/FormLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/Input';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { LoadingButton } from '@mui/lab';

//Icons
import GitHubIcon from '@mui/icons-material/GitHub';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

//components
import Platforms from 'components/Platforms';
import { getValue, saveValue, deleteValue } from 'utils/Storage';
import LoginDialog from 'components/LoginDialog';
import { BuildGraph, SetupDependencies, KillProcess } from 'utils/UE4Commands';

//API
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { listen, emit } from '@tauri-apps/api/event';
import { relaunch } from '@tauri-apps/api/process';
import { checkUpdate, installUpdate } from "@tauri-apps/api/updater";
import { fs } from '@tauri-apps/api';

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const App = () => {
  const [UE4Path, setUE4Path] = useState<any>("");
  const [UE4Github, setUE4Github] = useState<any>("https://github.com/EpicGames/UnrealEngine");
  const [openLoginDialog, setOpenLoginDialog] = useState<Boolean>(false);
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [anchorElMenu, setAnchorElMenu] = useState<any>(null);
  const [openNotifications, setOpenNotifications] = useState<any>(false);
  const [UE4Version, setUE4Version] = useState<any>(4.27);
  const [isBuilding, setIsBuilding] = useState<any>();
  const [isGHConnected, setisGHConnected] = useState<any>();
  const [donwloadDeps, setDonwloadDeps] = useState<any>();
  const [latestTag, setLatestTag] =  useState<any>();
  const [isCloning, setIsCloning] = useState<any>(false);
  const [updateAvailableUE, setUpdateAvailableUE] = useState<Boolean>(false);
  const [updateAvailableBpk, setUpdateAvailableBpk] = useState<Boolean>(false);
  const [pendingUpdate, setPendingUpdate] = useState<any>();
  const [finishedupdateBpk, setFinishedUpdateBpk] = useState<Boolean>(false);
  const [avatar, setAvatar] = useState<any>("");
  const [pid, setPid] = useState<any>(); 
  const stdoutput = useRef<any>();

  const openMenu = Boolean(anchorElMenu);

  let PlatformType: any = [];
  const Platform = (data: any) => {
    PlatformType.push(data.host);
  };

  const listenUpdateState = () => {
    installUpdate();
    setPendingUpdate(true);
    listen('tauri://update-status', (status: any) => {
       switch (status.payload.status) {
          case "DONE": setFinishedUpdateBpk(true);
          break;
          case "ERROR": console.log("error : " + status.payload.error ),
            setPendingUpdate(false);
          break;
       }
  })
}

  useEffect(() => {
    const updater = async () => {
      const {shouldUpdate, manifest} = await checkUpdate();
      if (shouldUpdate) {
        setUpdateAvailableBpk(true);
      }
    }
    
    updater();

    listen('objects', (event: any) => {
      let size = String(Math.floor(event.payload.size * 100) / 100)  + "kiB";
      if (event.payload.size > 1024) {
        size = (Math.floor(event.payload.size / 1024 * 100) / 100).toString() + "MiB";
      }
      if (event.payload.size > 1024 * 1024) {
        size = (Math.floor(event.payload.size / (1024*1024) * 100) / 100).toString() + "GiB";
      }
      //stdoutput.current.value += "\n";
      stdoutput.current.value = "Receiving objects : " + event.payload.network_pct + "%" + " (" + event.payload.received_objects + "/" + event.payload.total_objects + "), " + size ;
    })

    listen('deltas', (event: any) => {
      stdoutput.current.value = "Resolving deltas : " + "(" + event.payload.indexed_deltas + "/" + event.payload.total_deltas + ")"; 
    });

    listen('deltas_fetch', (event: any) => {
      stdoutput.current.value = "Resolving deltas : " + "(" + event.payload.indexed_deltas + "/" + event.payload.total_deltas + ")"; 
    });

    listen('unrealengine://update-available', (event: any) => {
        setLatestTag(event.payload.version)
        setUpdateAvailableUE(true);
    })

    listen('finish', () => {
        setIsCloning(false);
    })

    getValue("UE4Github").then((value: any) => {
      if ( value != undefined)  {
        setUE4Github(value);
      }
    })
    .catch(() =>{});

    getValue("UE4Path").then((value: any) => {
      if ( value != undefined)  {
        setUE4Path(value);
      }
    })
    .catch(() =>{});

    getValue("UE4Version")
    .then((version: any) => {
        setUE4Version(version);
    })
    .catch(() => {
    })
  });

  const closeSnackbar = (event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenNotifications(false);
  };

  const handleOpenLoginDialog = (event: any) => {
    setOpenLoginDialog(true);
    setAnchorEl(event.currentTarget);
  }

  const CloseLoginDialog = () => {
    setOpenLoginDialog(false);
  }

  const handleDisconnect = () => {
    setAnchorElMenu(null);
    setisGHConnected(false);
    deleteValue("username")
    deleteValue("pat");
  }

  const Connected = () => {
    setisGHConnected(true);
  }

  const RunCommand = (arg: any) => {
    stdoutput.current.value = "";
    if (arg === "BuildGraph") {
      if (UE4Path === "") {
        stdoutput.current.value = "Please set UE4 directory";
      }
      else {
        fs.readDir(UE4Path).then(data => {
          if (!data.length)
          stdoutput.current.value += "The directory you specified is empty" ;
        })
        setIsBuilding(true);
        BuildGraph(PlatformType, UE4Path, (data: any) => {
          setPid(data.pid);
          if (data.error) {
            stdoutput.current.value += data.error + "\r" ;
          }
          if (data.stderr) {
            stdoutput.current.value += data.stderr + "\r" ;
          }
          if (data.signal === 0 || 1)
            setIsBuilding(false);
        });
      }
    }
    if (arg === "Kill") {
      KillProcess(pid)
        .then((data: any) => {
          stdoutput.current.value += data;
        });
      setIsBuilding(false);
    }
    if (arg === "Setup")
      if (UE4Path === "") {
        stdoutput.current.value = "Please set UE4 directory";
      }
      else {
        SetupDependencies(UE4Path, (data: any) => {
          setDonwloadDeps(true);
          stdoutput.current.value += data + "\r";
          if (data.code === 0)
            setDonwloadDeps(true);
        });
      }
      if ( arg === "clone") {
        stdoutput.current.value = "Cloning UnrealEngine";
      setIsCloning(true);
        invoke("clone", { args: {
          arg_url: UE4Github, arg_path: UE4Path, arg_tag: UE4Version}
        })
        .then((value) => {
          stdoutput.current.value = value ;
        })
      }
  }

  const openDialog = () => {
    open({
      directory: true
    })
      .then(res => {
        //TODO: - check if a git repository
        invoke("get_available_space", {
          path: res
        })
        .then((data: any) => {
          let available_space = Math.round(data / Math.pow(1024, 3) * 100) /100  ;
          if (available_space < 100 )
            stdoutput.current.value = `Not enough space, you need at least 100G available and you have only ${available_space}G`  ;
          else {
            saveValue("UE4Path", res);
            setUE4Path(res);
          } 
          setUE4Path(res);   
        })
      });
    }

  return (
    <div>
       <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={1}>
          {
            isGHConnected ? (
              <div>
                  <Avatar
                  alt="foo"
                src={avatar}
                onClick={(event) => setAnchorElMenu(event.currentTarget)}
                sx={{ width: 50, height: 50,  position: 'fixed', right: 35, top: 5 }}
              />
              <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorElMenu}
        open={openMenu}
        onClose={() => setAnchorElMenu(null)}
      >
        <MenuItem onClick={handleDisconnect}>Logout</MenuItem>
        </Menu>
        </div>
            ) : (
              <div>
              <IconButton 
                color="primary" 
                aria-label="upload picture" 
                component="span"
                onClick={handleOpenLoginDialog}      
                sx={{position: 'fixed', right: 35, top: 5 }}    
                >
              <GitHubIcon sx={{ width: 40, height: 40 }} />
            </IconButton>
            <LoginDialog 
              openDialog={openLoginDialog} 
              closeDialog={CloseLoginDialog} 
              anchorEl={anchorEl}
              isConnected={Connected}
              avatar_url={(value: any) => setAvatar(value)}
            >
            </LoginDialog>
            </div>
            )
          }
          <Grid item>
            <TextField
              id="UE4 git"
              label="UE4 Github"
              value={UE4Github}
              inputProps={{ 'aria-label': 'bare' }}
              onClick={openDialog}
            />
          </Grid>
          <Grid item>
            <InputLabel htmlFor='UE4path'>UE4 Path</InputLabel>
            <Input
              id="UE4Path"
              value={UE4Path}
              type='text'
              inputProps={{ 'aria-label': 'bare' }}
              endAdornment={ 
                <InputAdornment position='end'>
                  <IconButton onClick={() => openDialog()}>
                    <FolderOpenIcon/>
                  </IconButton>
                </InputAdornment>
              }
            />
          </Grid>
          <Grid item>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="ue4version">UE4 Version</InputLabel>
                <Select
                  labelId="ue4version"
                  id="UE4Version"
                  value={UE4Version}
                  onChange={event => setUE4Version(event.target.value)}
                > 
                  <MenuItem value={4.25}>4.25</MenuItem>
                  <MenuItem value={4.26}>4.26</MenuItem>
                  <MenuItem value={4.27}>4.27</MenuItem>
                </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box> 
      {
        !isCloning ?
      <Button
        variant="contained"
        color="primary"
        disabled={ donwloadDeps || isCloning || !isGHConnected }
        onClick={() => RunCommand("clone")}
      >
      Clone
      </Button>
      :
      <Button
       variant="contained"
       color="primary"
       onClick={() => setIsCloning(true)}
      >
      Stop
      </Button>
      }
      {
        !donwloadDeps ? (
          <Button 
            variant="contained" 
            color="primary"
            disabled={ isCloning || isBuilding }
            onClick={() => RunCommand("Setup")}
          >
          Setup Dependencies
          </Button>
        ) :  
        (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => RunCommand("Kill")}
          >
          Stop Setup Dependencies
          </Button>
        )
      }
      <Platforms Platform={Platform} />

      <TextField
        id="outlined-multiline-static"
        multiline
        rows="10"
        defaultValue="Welcome"
        fullWidth
        inputRef={stdoutput}
        margin="normal"
        variant="outlined"
        inputProps={{
        readOnly: true
        }}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
      {
        !isBuilding ?
        (
          <Button 
            variant="contained" 
            color="primary" 
            disabled={ donwloadDeps || isCloning }
            onClick={() => {
              RunCommand("BuildGraph")
              }
            }       
          >
          Start
          </Button>
        ) :
        (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => RunCommand("Kill")}       
          >
          Stop
          </Button>
        )
      }
      {
        updateAvailableUE || updateAvailableBpk ? (
          <div>
            <IconButton 
              color="primary" 
              aria-label="update" 
              component="span"
              sx = {{
                display: "flex",
                position: 'absolute',
                left: 0
              }}
              onClick={() => setOpenNotifications(true)}
            >
              <Badge badgeContent={1} color="error">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
             <Snackbar
                open={openNotifications}
                autoHideDuration={5000}
                onClose={() => setOpenNotifications(false)}
              >
                <Alert
                  onClose={closeSnackbar}
                  severity="info"
                  >
                    {
                      updateAvailableUE ? (
                        <div>
                          <FormLabel>
                          {latestTag} is available, do you want to update ?
                          </FormLabel>
                          <Button
                            color="secondary"
                            size="small"
                            onClick={() => invoke("pull", {
                            path: UE4Path
                            })
                            }
                          >
                          Yes
                          </Button>
                          <Button 
                            color="secondary"
                            size="small"
                            onClick={closeSnackbar}
                          >
                          No
                          </Button>
                        </div>
                      ) : null
                    }
                    {
                      updateAvailableBpk ? (
                        <div>
                          <FormLabel>
                           An update is available, do you want to update ?
                          </FormLabel>
                          <LoadingButton
                            color="secondary"
                            size="small"
                            loading={pendingUpdate}
                            onClick={ listenUpdateState }
                          >
                          Yes
                          </LoadingButton>
                          <Button 
                            color="secondary"
                            size="small"
                            onClick={closeSnackbar}
                          >
                          No
                          </Button>
                        </div>
                      ) : null
                    }
                    {
                      finishedupdateBpk ? (
                        <div>
                          <FormLabel>
                            The update is ready, do you want to restart now ?
                          </FormLabel>
                          <Button
                            color="secondary"
                            size="small"
                            onClick={() => relaunch() }
                          >
                          Restart
                          </Button>
                        </div>
                      ) : null
                    }
                  </Alert>
              </Snackbar>
          </div>
        ) : null 
      }
      </Box>
      </div>
  );
}

export default App;
