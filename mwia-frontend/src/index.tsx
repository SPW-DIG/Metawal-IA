import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {HashRouter, Route, Switch} from 'react-router-dom';
import './app.scss';
import {Welcome} from "./pages/welcome";
import {AdminPanel} from "./pages/admin";
import {SolidDashboard} from "./pages/solid";
import {SearchAndRec} from "./pages/recommandations";
import {MwiaAuth} from "./auth";
import {AppNavBar} from "./navbar";
import {ErrorBoundary} from "./utils/ui-utils";


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
            <MwiaAuth.SessionProvider>
                {({session}) => (
                    <HashRouter>
                        <div className="dashboardApp vFlow">
                            <AppNavBar/>
                            <div style={{padding: '20px 200px'}}>
                                <ErrorBoundary>
                                    <Switch>
                                        {routes.map((route, i) => (
                                            <Route exact={route.exact} path={route.path} key={i}>
                                                {(route.requiresAuth && !session.userId) ? <div>Please login</div> :
                                                    <route.component/>}
                                            </Route>
                                        ))}
                                    </Switch>
                                </ErrorBoundary>
                            </div>
                        </div>
                    </HashRouter>
                )}

            </MwiaAuth.SessionProvider>
        );
    }
;

ReactDOM.render(
    <App/>
    , document.getElementById('index'));
