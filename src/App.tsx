import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

//components
import Platforms from 'components/Platforms';
//import { Command } from "@tauri-apps/api/shell"

function App() {
  var PlatformType: any; 
  const Platform = (data: any) => {  
    PlatformType = data;
  };
  return (
    <div>
      <Platforms Platform={Platform} />
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
