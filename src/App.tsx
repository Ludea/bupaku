import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import GitHubIcon from '@mui/icons-material/GitHub';

//components
import Platforms from 'components/Platforms';
import { getValue, saveValue } from 'utils/Storage';
import LoginDialog from 'components/LoginDialog';
import { BuildGraph, SetupDependencies, KillProcess } from 'utils/UE4Commands';

//API
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from '@tauri-apps/api/event'

const App = () => {
  const [UE4Path, setUE4Path] = useState<any>("");
  const [UE4Github, setUE4Github] = useState<any>("https://github.com/EpicGames/UnrealEngine");
  const [openLoginDialog, setOpenLoginDialog] = useState<Boolean>(false);
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [UE4Version, setUE4Version] = useState<any>(4.27);
  const [isBuilding, setIsBuilding] = useState<any>();
  const [isGHConnected, setisGHConnected] = useState<any>();
  const [donwloadDeps, setDonwloadDeps] = useState<any>();
  const stdoutput = useRef<any>();

  let PlatformType: any;
  const Platform = (data: any) => { 
    PlatformType = data.host;
  };

  useEffect(() => {
    const unlisten = listen('objects', (event: any) => {
      stdoutput.current.value = "";
      stdoutput.current.value = "Receiving object : " + event.payload.network_pct + "%" + " (" + event.payload.received_objects + "/" + event.payload.total_objects + "), " + event.payload.size + "KiB" ;
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

  const handleOpenLoginDialog = (event: any) => {
    setOpenLoginDialog(true);
    setAnchorEl(event.currentTarget);
  }

  const CloseLoginDialog = () => {
    setOpenLoginDialog(false);
  }

  const Connected = () => {
    setisGHConnected(true);
  }

  const RunCommand = (arg: any) => {
    stdoutput.current.value = "";
    if (arg === "BuildGraph") {
      if (UE4Path === undefined) {
        stdoutput.current.value = "Please set UE4 directory";
      }
      else {
        setIsBuilding(true);
        BuildGraph(PlatformType, UE4Path, (data: any) => {
          stdoutput.current.value += data + "\r";
          if (data.code === 0)
            setIsBuilding(false);
        });
      }
    }
    if (arg === "Kill") {
      KillProcess
        .then((data: any) => {
          stdoutput.current.value += data;
        });
      setIsBuilding(false);
    }
    if (arg === "Setup")
      if (UE4Path === undefined) {
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
      if ( arg === "clone")
        invoke("clone", { args: {
          arg_url: UE4Github, arg_path: UE4Path}
        })
        .then((value) => {
          stdoutput.current.value = value ;
        })
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
          <IconButton 
            color="primary" 
            aria-label="upload picture" 
            component="span"
            onClick={handleOpenLoginDialog}
            sx={{
              position: 'fixed' ,
              right: 0
            }}>
            <GitHubIcon />
          </IconButton>
          <LoginDialog 
            openDialog={openLoginDialog} 
            closeDialog={CloseLoginDialog} 
            anchorEl={anchorEl}
            isConnected={Connected}
          >
          </LoginDialog>
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
            <TextField
              id="UE4Path"
              label="UE4 path"
              value={UE4Path}
              inputProps={{ 'aria-label': 'bare' }}
              onClick={openDialog}
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
      <Button
        variant="contained"
        color="primary"
        onClick={() => RunCommand("clone")}
      >
      Clone
      </Button>
      {
        !donwloadDeps ? (
          <Button 
            variant="contained" 
            color="primary"
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
            disabled={donwloadDeps}
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
      </Box>
      </div>
  );
}

export default App;
