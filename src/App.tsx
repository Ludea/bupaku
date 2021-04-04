import { useState } from 'react';
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
import { Command } from "@tauri-apps/api/dist/shell"

function App() {
  const [UE4Path, setUE4Path] = useState<any>();
  const [UE4Version, setUE4Version] = useState<any>();

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
        margin="normal"
        variant="outlined"
        inputProps={{
        readOnly: true
        }}
      />
      <Button 
        variant="contained" 
        color="primary"        
      >
      Start
      </Button>
      </div>
  );
}

export default App;
