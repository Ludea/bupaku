import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Popover from '@mui/material/Popover';
import FormLabel from '@mui/material/FormLabel';

//components
import { saveValue } from 'utils/Storage';

//API
import { invoke } from "@tauri-apps/api/tauri";

const LoginDialog = ({openDialog, closeDialog, isConnected, anchorEl}: any) => {
    const [login, setLogin] = useState("");
    const [PAT, setPAT] = useState("");
    const [isLoginEmpty, setIsLoginEmpty] = useState<Boolean>(false);
    const [isPATEmpty, setIsPATEmpty] = useState<Boolean>(false);

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    const handleLogin = () => {
        if (login === "") 
            setIsLoginEmpty(true)
        else {
            setIsLoginEmpty(false)
            if (PAT === "")
            setIsPATEmpty(true)
            else {
                setIsPATEmpty(false);
                saveValue("username", login );
                saveValue("PAT", PAT );
                handleConnection();
            }
        }
    };

    const handleClose = () => {
        closeDialog() ;
    };

    const handleConnection = () => {
        invoke("getuerepopermission", 
        { token: PAT })
        .then((value: any) => {
            console.log(value);
        })
        .catch((value: any) => {
            console.log(value);
        });
        isConnected();
        closeDialog() ;
    };

    return (
        <Popover
            id={id}
            open={openDialog}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
        >
            <Card sx={{ maxWidth: 250}}>
                <CardContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="login"
                        label="Github Login or Email "
                        type="email"
                        fullWidth
                        variant="standard"
                        onChange={event => setLogin(event.target.value)}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="PAT"
                        label="Personal Access Token"
                        type="password"
                        fullWidth
                        variant="standard"
                        onChange={event => setPAT(event.target.value)}
                    /> 
                    </CardContent>
                    <CardActions>
                        <Button variant="contained" onClick={ handleLogin }>
                        Sign In
                        </Button>
                        <Button variant="contained" onClick={ handleClose }>
                        Cancel
                        </Button>
                    </CardActions> 
                {
                    isLoginEmpty ?
                    <FormLabel component="legend">
                    Please fill your Github username or Email
                    </FormLabel>
                    : null
                }
                {
                    isPATEmpty ?
                    <FormLabel component="legend">
                    Please fill your Personal Access Token
                    </FormLabel>
                    : null
                }
                
            </Card>
        </Popover>   
    );
}

export default LoginDialog ;