import { useState, useRef } from 'react';
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

//API
import { Command } from "@tauri-apps/api/dist/shell"
import { invoke } from "@tauri-apps/api/dist/tauri";
import { open } from "@tauri-apps/api/dist/dialog";

let cmd: any;
let args: any;
let extensions: any;
let child;

function App() {
  const [UE4Path, setUE4Path] = useState<any>();
  const [UE4Version, setUE4Version] = useState<any>();
  const stdoutput = useRef<any>();

  function spawn(script: any) {
    invoke("detect_os")
    .then(data => {
      switch (data) {
        case 'windows': 
          cmd = "powershell";
          args = ['/C'];
          extensions = '.bat'
          break;
        case 'macos': 
          cmd = "sh"
          args = ['-c'];
          extensions = '.command'
          break;
        case 'linux': 
          cmd = "sh"
          args = ['-c'];
          extensions = '.sh'
          break;
      }
      child = null
      const command = new Command(cmd, [...args, script])
      command.on('close', data => {
        child = null
      })
      command.on('error', error => {
        stdoutput.current.value = error
        console.log(JSON.stringify(error))
      })
      command.stdout.on('data', line => {
        stdoutput.current.value = line
        console.log(line)
      })
      
      command.stderr.on('data', line => stdoutput.current.value = JSON.stringify(line))
    
      command.spawn()
        .then(data => {
          child = data
          stdoutput.current.value = JSON.stringify(data)
        })
        .catch(error => {
          console.log("error : " + JSON.stringify(error))
        })
      })
      .catch(data => stdoutput.current.value = data );
  }

  function openDialog() {
    open({
      directory: true
    })
      .then(function (res) {
        //TODO: - check if a git repository
        invoke("get_available_space", {
          path: res
        })
        .then((data: any) => {
          let available_space = Math.round(data / Math.pow(1024, 3) * 100) /100  ;
          if (available_space < 100 )
            stdoutput.current.value = `Not enough space, you need at least 100G available and you have only ${available_space}G`  ;
          else 
          setUE4Path(res);
        })
      });
    }

  var PlatformType: any; 
  const Platform = (data: any) => {  
    PlatformType = data;
  };
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
        onClick={e => spawn(UE4Path + 'Setup')}
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
      <Button 
        variant="contained" 
        color="primary" 
        onClick={spawn}       
      >
      Start
      </Button>
      </div>
  );
}

export default App;
