import {AppBar, Box, Button, Toolbar} from "@mui/material";
import React from "react";
import {Link, NavLink} from "react-router-dom";
import {MwiaAuth} from "./auth";

export const AppNavBar = () => {
    const session = MwiaAuth.useSession();

    return (
        <AppBar position="static" className='navbar' sx={{color: "#2b2b2b", bgcolor: '#f1f1f1', padding: "10px"}}>
            <Toolbar disableGutters>
                <Box sx={{flexGrow: 0}} component={Link} to="/">
                    <div className="metawal-logo" />
                </Box>
                <Box sx={{flexGrow: 0, marginLeft: "10px", marginRight: "30px", fontSize: '130%'}}>
                    <div>Metawal-IA</div>
                    <div style={{fontSize: "90%", color: "#3e8ba6"}}>Recommandations</div>
                </Box>


                <Box sx={{flexGrow: 1}}>
                    <Button component={NavLink} to="/search" variant="contained">Search</Button>
                    {session.isLoggedIn ?
                        <>
                        <Button component={NavLink} to="/solid" variant="contained">Dashboard</Button>
                        <Button component={NavLink} to="/admin" variant="contained">Admin</Button>
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