import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {HashRouter, Link, Route, Switch} from 'react-router-dom';
import './app.scss';
import {useEffect, useState} from 'react';
import {
    Collapse,
    Nav,
    Navbar,
    NavbarBrand,
    NavbarToggler,
    NavItem,
    NavLink,
} from 'reactstrap';
import {LoginButton, LogoutButton, SessionProvider, useSession} from '@inrupt/solid-ui-react';
import {Button, MenuItem, Select} from '@material-ui/core';
import {Welcome} from "./pages/welcome";
import {AdminPanel} from "./pages/admin";
import {SolidDashboard} from "./pages/solid";
import {SearchAndRec} from "./pages/recommandations";
import {getPodUrls, getPublicAccess, handleHttpPromiseStatus, SPW_PATH} from "@spw-dig/mwia-core";
import {getBackendUrl} from "./config";
import {_404_undefined} from "@spw-dig/mwia-core/dist/esm";

export type AppContextType = {
    webId?: string;
    podUrl?: string;
    accessGranted?: boolean,
    idDoc?: any;
    registeredUser?: any;

    updateCtx: (update: Partial<AppContextType>) => void;
};

function createInitAppContext(updateAppContextFn: (update: Partial<AppContextType>) => void, basemap?: string): AppContextType {
    return {
        updateCtx: updateAppContextFn
    };
}

export const AppContext = React.createContext<AppContextType>(createInitAppContext(() => null));

export function AppContextProvider(props: { children: (ctx: AppContextType) => React.ReactNode }) {

    const [appContext, setAppContext] = useState<AppContextType>(
        createInitAppContext(function (update) {
            setAppContext((prevCtx: AppContextType) => ({...prevCtx, ...update}));
        })
    );

    const {session} = useSession();

    useEffect(
        () => {
            if (session.info.isLoggedIn && session.info.webId) {
                getPodUrls(session.info.webId, {fetch: session.fetch}).then(urls => urls[0])
                    .then(async (podUrl) => {
                        const access = await getPublicAccess(podUrl + SPW_PATH, session.fetch).catch(err => undefined) || undefined;
                        const idDoc = await session.fetch(session.info.webId!, {headers: {'Accept': 'text/turtle'}}).then(resp => resp.text());
                        const registeredUser = await fetch(getBackendUrl("/user", {userUri: session.info.webId}).toString()).then(handleHttpPromiseStatus).then(resp => resp.json()).catch(_404_undefined);

                        appContext.updateCtx({
                            podUrl,
                            accessGranted: access?.read && access?.write,
                            idDoc,
                            registeredUser,
                            webId: session.info.webId
                        });
                    })
            } else {
                appContext.updateCtx({
                    webId: undefined,
                    podUrl: undefined,
                    registeredUser: undefined,
                    idDoc: undefined,
                    accessGranted: false
                });
            }
        },
        // run this only once
        [session, session.info.webId]
    );

    return <AppContext.Provider value={appContext}>{props.children(appContext)}</AppContext.Provider>;
}

export const AppNavBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const {session} = useSession();

    const toggle = () => setIsOpen(!isOpen);

    return (
        <Navbar expand="md" className="dashboard-navbar">
            <NavbarBrand href="/">
                <img src="https://geoportail.wallonie.be/files/images/logo_GPWal200X200.png"/>
                <span className="title">Metawal-IA</span>
            </NavbarBrand>
            <NavbarToggler onClick={toggle}/>
            <Collapse isOpen={isOpen} navbar>
                <Nav className="me-auto">
                    <NavItem>
                        <NavLink tag={Link} to="/">
                            Welcome
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink tag={Link} to="/search">
                            Search
                        </NavLink>
                    </NavItem>
                    {session.info.isLoggedIn ?
                        <NavItem>
                            <NavLink tag={Link} to="/solid">
                                Dashboard
                            </NavLink>
                        </NavItem> : null}
                    <NavItem>
                        <NavLink tag={Link} to="/admin">
                            Admin
                        </NavLink>
                    </NavItem>

                </Nav>
                <Nav className="mr-auto">
                    <NavItem>
                        {session.info.isLoggedIn ? (
                            <div style={{display: 'flex', flexDirection: 'row'}}>
                                <NavLink style={{display: 'inline'}} tag={Link} to="/user">
                                    <i className="fa fa-user"/> {session.info.webId}
                                </NavLink>
                                <LogoutButton>
                                    <Button variant="contained" color="primary">
                                        Log&nbsp;out
                                    </Button>
                                </LogoutButton>
                            </div>
                        ) : <LoginMultiButton/>}
                    </NavItem>
                </Nav>
            </Collapse>
        </Navbar>
    );
};

const ISSUERS = {
    //"https://openid.sandbox-pod.datanutsbedrijf.be": "DNB Sandbox",
    "https://inrupt.net": "Inrupt.net",
    "https://solidcommunity.net/": "Solid Community",
    "https://login.inrupt.com/": "Inrupt Pod Spaces",
    "https://idp.use.id/": "use.id",
    "http://localhost:3000/": "Localhost Solid"
}

function removeTrailingSlash(url: string) {
    if (url.endsWith('/')) url = url.substring(0, url.length - 1);

    return url;
}

export const LoginMultiButton = () => {
    const [issuer, setIssuer] = useState("https://login.inrupt.com/");

    return (
        <LoginButton
            authOptions={
                {
                    clientName: "Geoportail",
                    /* clientId: "https://metawal.datavillage.me/appid" */
                    /* tokenType: 'Bearer'*/
                    /*, popUp: true */
                }
            }
            oidcIssuer={issuer}
            // this is the ID issuer for the DNB sandbox
            redirectUrl={removeTrailingSlash(new URL("/", window.location.href).toString())}
            onError={console.log}
        >
            <Button variant="contained" color="primary">
                Log in with&nbsp;
                <Select
                    value={issuer}
                    onChange={(e) => {
                        setIssuer(e.target.value as string);
                        e.stopPropagation()
                    }}
                >
                    {Object.keys(ISSUERS).map(uri => <MenuItem value={uri} key={uri}>{ISSUERS[uri]}</MenuItem>)}
                </Select>
            </Button>
        </LoginButton>
    );
};


const routes = [
    {
        component: Welcome,
        exact: true,
        path: '/',
        requiresAuth: false
    },
    {
        component: SearchAndRec,
        exact: false,
        path: '/search',
        requiresAuth: false
    },
    {
        component: SolidDashboard,
        exact: false,
        path: '/solid',
        requiresAuth: true
    },
    {
        component: AdminPanel,
        exact: false,
        path: '/admin',
        requiresAuth: true
    }
];

export const App = () => {
        return (
            <SessionProvider onError={console.log}>
                <HashRouter>
                    <AppContextProvider>
                        {ctx => (
                            <div className="dashboardApp vFlow">
                                <AppNavBar/>
                                <div style={{padding: '20px 200px'}}>
                                    <Switch>
                                        {routes.map((route, i) => (
                                            <Route exact={route.exact} path={route.path} key={i}>
                                                {(route.requiresAuth && !ctx.webId) ? <div>Please login</div> :
                                                    <route.component/>}

                                            </Route>
                                        ))}
                                    </Switch>
                                </div>
                            </div>
                        )}
                    </AppContextProvider>
                </HashRouter>
            </SessionProvider>
        );
    }
;

ReactDOM.render(
    <App/>
    , document.getElementById('index'));
