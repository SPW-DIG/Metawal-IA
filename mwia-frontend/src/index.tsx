import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {HashRouter, Link, Route, Switch} from 'react-router-dom';
import './app.scss';
import {useState} from 'react';
import {
    Collapse,
    Nav,
    Navbar,
    NavbarBrand,
    NavbarToggler,
    NavItem,
    NavLink,
} from 'reactstrap';
import {Button} from '@material-ui/core';
import {Welcome} from "./pages/welcome";
import {AdminPanel} from "./pages/admin";
import {SolidDashboard} from "./pages/solid";
import {SearchAndRec} from "./pages/recommandations";

import {DEFAULT_AUTH} from './auth';

export type AppContextType = {
    //webId?: string;
    //podUrl?: string;
    //accessGranted?: boolean,
    //idDoc?: any;
    //registeredUser?: any;

    updateCtx: (update: Partial<AppContextType>) => void;
};

/*
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

    const session = auth.useSession();

    useEffect(
        () => {
            if (session.isLoggedIn && session.userId) {
                getPodUrls(session.userId, {fetch: session.fetch}).then(urls => urls[0])
                    .then(async (podUrl) => {
                        const access = await getPublicAccess(podUrl + SPW_PATH, session.fetch).catch(err => undefined) || undefined;
                        const idDoc = await session.fetch(session.userId!, {headers: {'Accept': 'text/turtle'}}).then(resp => resp.text());
                        const registeredUser = await fetch(getBackendUrl("user", {userUri: session.userId}).toString()).then(handleHttpPromiseStatus).then(resp => resp.json()).catch(_404_undefined);

                        appContext.updateCtx({
                            podUrl,
                            accessGranted: access?.read && access?.write,
                            idDoc,
                            registeredUser,
                            webId: session.userId
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
        [session, session.userId]
    );

    return <AppContext.Provider value={appContext}>{props.children(appContext)}</AppContext.Provider>;
}

 */

export const AppNavBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const session = DEFAULT_AUTH.useSession();

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
                    {session.isLoggedIn ?
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
                        {session.isLoggedIn ? (
                            <div style={{display: 'flex', flexDirection: 'row'}}>
                                <NavLink style={{display: 'inline'}} tag={Link} to="/user">
                                    <i className="fa fa-user"/> {session.userId}
                                </NavLink>
                                <DEFAULT_AUTH.LogoutButton>
                                    <Button variant="contained" color="primary">
                                        Log&nbsp;out
                                    </Button>
                                </DEFAULT_AUTH.LogoutButton>
                            </div>
                        ) : <DEFAULT_AUTH.LoginButton />}
                    </NavItem>
                </Nav>
            </Collapse>
        </Navbar>
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
            <DEFAULT_AUTH.SessionProvider>
                {({session}) => (
                    <HashRouter>
                        { /* <AppContextProvider>
                        {ctx => ( */ }
                        <div className="dashboardApp vFlow">
                            <AppNavBar/>
                            <div style={{padding: '20px 200px'}}>
                                <Switch>
                                    {routes.map((route, i) => (
                                        <Route exact={route.exact} path={route.path} key={i}>
                                            {(route.requiresAuth && !session.userId) ? <div>Please login</div> :
                                                <route.component/>}

                                        </Route>
                                    ))}
                                </Switch>
                            </div>
                        </div>
                        { /*    )}
                    </AppContextProvider> */ }
                    </HashRouter>
                )}

            </DEFAULT_AUTH.SessionProvider>
        );
    }
;

ReactDOM.render(
    <App/>
    , document.getElementById('index'));
