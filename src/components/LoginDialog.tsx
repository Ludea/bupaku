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

const LoginDialog = ({openDialog, closeDialog, isConnected, anchorEl}: any) => {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [isLoginEmpty, setIsLoginEmpty] = useState<Boolean>();
    const [isPasswordEmpty, setIsPasswordEmpty] = useState<Boolean>(false);

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    const Login = () => {
        if (login === "") 
            setIsLoginEmpty(true)
        else {
            setIsLoginEmpty(false)
            if (password === "")
                setIsPasswordEmpty(true)
            else {
                setIsPasswordEmpty(false);
                saveValue("username", login );
                saveValue("password", password );
                handleConnection();
            }
        }
    }

    const handleClose = () => {
        closeDialog() ;
    }

    const handleConnection = () => {
        isConnected();
        closeDialog() ;
    }

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
                        label="Login"
                        type="email"
                        fullWidth
                        variant="standard"
                        onChange={event => setLogin(event.target.value)}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="password"
                        label="Personal Access Token"
                        type="password"
                        fullWidth
                        variant="standard"
                        onChange={event => setPassword(event.target.value)}
                    /> 
                    </CardContent>
                    <CardActions>
                        <Button variant="contained" onClick={ Login }>
                        Sign In
                        </Button>
                        <Button variant="contained" onClick={ handleClose }>
                        Cancel
                        </Button>
                    </CardActions> 
                {
                    isLoginEmpty ?
                    <FormLabel component="legend">
                    </FormLabel>
                    : null
                }
                {
                    isPasswordEmpty ?
                    <FormLabel component="legend">
                    </FormLabel>
                    : null
                }
                
            </Card>
        </Popover>   
    );
}

export default LoginDialog ;