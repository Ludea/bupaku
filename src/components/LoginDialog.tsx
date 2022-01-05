import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Popover from '@mui/material/Popover';
import FormLabel from '@mui/material/FormLabel';
import LoadingButton from '@mui/lab/LoadingButton';

//components
import { saveValue, getValue } from 'utils/Storage';

//API
import { invoke } from "@tauri-apps/api/tauri";

const LoginDialog = ({openDialog, closeDialog, isConnected, anchorEl, avatar_url}: any) => {
    const [login, setLogin] = useState("");
    const [PAT, setPAT] = useState("");
    const [pendingLogin, setPendingLogin] = useState<any>();
    const [isLoginEmpty, setIsLoginEmpty] = useState<Boolean>(false);
    const [isPATEmpty, setIsPATEmpty] = useState<Boolean>(false);

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    useEffect(() => {
        getValue("username")
        .then((username: any) => {
            if ( username != undefined)  {
                getValue("pat")
                .then((pat: any) => {
                    if ( pat != undefined)  {
                        isConnected(true);
                    }
                })
                .catch(() => {});
            }
          })
          .catch(() =>{});
    });
    
    const handleLogin = () => {
        if (login === "") 
            setIsLoginEmpty(true)
        else {
            setIsLoginEmpty(false)
            if (PAT === "")
            setIsPATEmpty(true)
            else {
              setPendingLogin(true);
              invoke("handleconnection", 
               { token: PAT })
              .then((value: any) => {
                  isConnected();
                  closeDialog() ;
                  avatar_url(value);
              })
              .catch((value: any) => {
                console.log(value);
              });
            }
        }
    };

    const handleClose = () => {
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
                    <LoadingButton
                       loading={pendingLogin}
                       variant='contained'
                       onClick= { handleLogin }
                     >
                    Sign In
                    </LoadingButton>
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