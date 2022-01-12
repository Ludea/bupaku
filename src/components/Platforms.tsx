import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

//component
import { getValue, saveValue } from 'utils/Storage'

const Platforms = (props: any) => {
    const [checked, setChecked] = useState<any>({
        HostOnly: false,
        Win64: false,
        Win32: false,
        Mac: false,
        Linux: false,
        Android: false,
        IOS: false,
        TVOS: false,
        Switch: false,
        PS4: false,
        Xbox: false,
        Lumin: false,
        Hololens: false,
    });

    /*useEffect(() => {
        getValue("Platforms").then((state: any) => {
          if ( state != null)  {
            setChecked(state);
          }
        });
      }, []);*/
    let host: any ;
    const handleChange = (event: any) => {
        setChecked((checked: any) => ({...checked, [event.target.name]: event.target.checked}));
        host = {
            "name": event.target.name,
            "value": event.target.checked
        };
       // saveValue(event.target.name, event.target.checked.toString());
        props.Platform({host});
    };

    return (
        <Box sx={{ display: 'flex' }}>
        <FormGroup>
            <FormControlLabel control={<Checkbox name="HostOnly" onChange={handleChange} checked={checked.HostOnly} />} label="Host Only" />
            <FormControlLabel control={<Checkbox name="Win64" onChange={handleChange} disabled={checked.HostOnly} checked={checked.Win64}/>} label="Win64" />
            <FormControlLabel control={<Checkbox name="Win32" onChange={handleChange} disabled={checked.HostOnly} checked={checked.Win32}/>} label="Win32" />
            <FormControlLabel control={<Checkbox name="Mac" onChange={handleChange} disabled={checked.HostOnly} checked={checked.Mac}/>} label="MacOS" />
            <FormControlLabel control={<Checkbox name="Linux" onChange={handleChange} disabled={checked.HostOnly} checked={checked.Linux}/>} label="Linux" />
        </FormGroup>
        <FormGroup>
            <FormControlLabel control={<Checkbox name="Android" onChange={handleChange} disabled={checked.HostOnly} checked={checked.Android} />} label="Android" />
            <FormControlLabel control={<Checkbox name="IOS" onChange={handleChange} disabled={checked.HostOnly} checked={checked.IOS} />} label="IOS" />
            <FormControlLabel control={<Checkbox name="TVOS" onChange={handleChange} disabled={checked.HostOnly} checked={checked.TVOS} />} label="TVOS" />
            <FormControlLabel control={<Checkbox name="Switch" onChange={handleChange} disabled={checked.HostOnly} checked={checked.Switch} />} label="Switch" />
            <FormControlLabel control={<Checkbox name="PS4" onChange={handleChange} disabled={checked.HostOnly} checked={checked.PS4} />} label="PS4" />
        </FormGroup>
        <FormGroup>
            <FormControlLabel control={<Checkbox name="Xbox" onChange={handleChange} disabled={checked.HostOnly} checked={checked.Xbox} />} label="Xbox" />
            <FormControlLabel control={<Checkbox name="Lumin" onChange={handleChange} disabled={checked.HostOnly} checked={checked.Lumin} />} label="Lumin" />
            <FormControlLabel control={<Checkbox name="Hololens" onChange={handleChange} disabled={checked.HostOnly} checked={checked.Hololens} />} label="Hololens" />
        </FormGroup>
        </Box>
    );
}

export default Platforms;