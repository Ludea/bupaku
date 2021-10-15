import { useState, useRef, useEffect } from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

//components
import Platforms from 'components/Platforms';
import { getValue, saveValue } from 'utils/Storage';
import { BuildGraph, SetupDependencies, KillProcess } from 'utils/UE4Commands';

//API
import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";

const App = () => {
  const [UE4Path, setUE4Path] = useState<any>();
  const [UE4Version, setUE4Version] = useState<any>();
  const [isBuilding, setIsBuilding] = useState<any>();
  const stdoutput = useRef<any>();

  let PlatformType: any; 
  const Platform = (data: any) => { 
    PlatformType = data.host;
  };

  useEffect(() => {
    getValue("UE4Path").then((value: any) => {
      if ( value != null)  {
        setUE4Path(value);
      }
    });
  }, []);

  const RunCommand = (arg: any) => {
    if (arg === "BuildGraph") {
      BuildGraph(PlatformType)
        .then((data: any) => {
          stdoutput.current.value += data;
          });
      setIsBuilding(true);
    }
    if (arg === "Kill") {
      KillProcess
        .then((data: any) => {
          stdoutput.current.value += data;
        });
      setIsBuilding(false);
    }
    if (arg === "Setup")
      SetupDependencies
      .then((data: any) => {
        stdoutput.current.value += data;
      });
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
      <Grid container spacing={3}>
        <Grid item xs={6}>
      <TextField
        id="UE4Path"
        label="UE4 path"
        value={UE4Path}
        margin="normal"
        inputProps={{ 'aria-label': 'bare' }}
        onClick={openDialog}
      />
      <FormControl>
        <InputLabel id="demo-simple-select-label">UE4 Version</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={UE4Version}
          onChange={event => setUE4Version(event.target.value)}
        >
          <MenuItem value={4.25}>4.25</MenuItem>
          <MenuItem value={4.26}>4.26</MenuItem>
        </Select>
      </FormControl>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => RunCommand("Setup")}
      >
      Setup Dependencies
      </Button>
      <Platforms Platform={Platform} />
      </Grid>
      </Grid>
      </Box>
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
      {
        !isBuilding ?
        (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => RunCommand("BuildGraph")}       
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
      </div>
  );
}

export default App;
