import { useState } from 'react';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

//components
import Platforms from 'components/Platforms';
//import { Command } from "@tauri-apps/api/shell"

function App() {
  const [UE4Path, setUE4Path] = useState<any>();

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
        fullWidth
        value={UE4Path}
        margin="normal"
        inputProps={{ 'aria-label': 'bare' }}
      />
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
