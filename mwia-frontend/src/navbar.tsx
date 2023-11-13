import {AppBar, Box, Button, Toolbar} from "@mui/material";
import React from "react";
import {Link} from "react-router-dom";
import {MwiaAuth} from "./auth";

export const AppNavBar = () => {
    const session = MwiaAuth.useSession();

    return (
        <AppBar position="static" className='navbar'>
            <Toolbar disableGutters>
                <div>
                    <img src="https://geoportail.wallonie.be/files/images/logo_GPWal200X200.png"/>
                    <span className="title">Metawal-IA</span>
                </div>


                <Box sx={{flexGrow: 1}}>
                    <Button component={Link} to="/" variant="contained">Welcome</Button>
                    <Button component={Link} to="/search" variant="contained">Search</Button>
                    {session.isLoggedIn ?
                        <>
                        <Button component={Link} to="/solid" variant="contained">Dashboard</Button>
                        <Button component={Link} to="/admin" variant="contained">Admin</Button>
                        </>
                        : null}
                </Box>


                <Box sx={{flexGrow: 0, float: 'right'}}>
                    {session.isLoggedIn ? (
                        <div style={{display: 'flex', flexDirection: 'row'}}>
                            <Button component={Link} to="/user" variant="contained">{session.userId}</Button>
                            <MwiaAuth.LogoutButton>
                                <Button variant="contained" color="primary">
                                    Log&nbsp;out
                                </Button>
                            </MwiaAuth.LogoutButton>
                        </div>
                    ) : <MwiaAuth.LoginButton/>}
                </Box>
            </Toolbar>
        </AppBar>

    );
};