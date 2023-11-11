import {LoginButton, LogoutButton, SessionProvider, useSession as inruptUseSession} from '@inrupt/solid-ui-react';
import {AuthModule, Session} from "./index";
import {useEffect, useState} from "react";
import {Button, MenuItem, Select} from "@material-ui/core";
import * as React from "react";
import {_404_undefined, getPodUrls, handleHttpPromiseStatus} from "@spw-dig/mwia-core";
import {getBackendUrl} from "../config";


const ISSUERS = {
    //"https://openid.sandbox-pod.datanutsbedrijf.be": "DNB Sandbox",
    "https://inrupt.net": "Inrupt.net",
    "https://solidcommunity.net/": "Solid Community",
    "https://login.inrupt.com/": "Inrupt Pod Spaces",
    "https://idp.use.id/": "use.id",
    "http://localhost:3000/": "Localhost Solid"
}

const LoginMultiButton = (props: { children?: React.ReactElement; }) => {
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
            redirectUrl={ window.location.href.split('#')[0] /* new URL("/", window.location.href ).toString()*/}
            onError={console.log}
        >
            {props.children || <Button variant="contained" color="primary">
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
            </Button>}
        </LoginButton>
    );
};


const useSession = () => {
    const solidSession = inruptUseSession();

    const [session, setSession] = useState<Session>({isLoggedIn: false, fetch});

    useEffect( () => {
        if (solidSession.session.info.isLoggedIn && solidSession.session.info.webId) {
            getPodUrls(solidSession.session.info.webId, {fetch: solidSession.fetch}).then(urls => urls[0])
                .then(async (podUrl) => {
                    //const access = await getPublicAccess(podUrl + SPW_PATH, solidSession.fetch).catch(err => undefined) || undefined;
                    //const idDoc = await solidSession.fetch(solidSession.session.info.webId!, {headers: {'Accept': 'text/turtle'}}).then(resp => resp.text());
                    const registeredUser = await fetch(getBackendUrl("user", {userUri: solidSession.session.info.webId}).toString()).then(handleHttpPromiseStatus).then(resp => resp.json()).catch(_404_undefined);

                    setSession ( {
                        isLoggedIn: solidSession.session.info.isLoggedIn,
                        userId: solidSession.session.info.webId,
                        app: registeredUser ? {isRegistered: true, appFolder: 'spw/'} : undefined,
                        fetch: solidSession.fetch,
                        // session: solidSession,
                        //accessGranted: access?.read && access?.write,
                    })
                })
        }
    }, [solidSession.session.info, solidSession.fetch])


    return session;
}

async function registerUser(webId: string, podUrl: string, fetchFn: typeof fetch) {
    await fetch(getBackendUrl("user/register", {userUri: webId, podUri: podUrl}).toString(),{method: 'POST'});
}


const SubscribeButton = () => {

    const session = useSession();

    return (
        session.userId ?
            <Button variant="contained" color="primary" onClick={() => registerUser(session.userId!, session.podUrl!, session.fetch)}>
                Souscrire au service Metawal-IA
            </Button> : <>Not authenticated</>
    );
};

export const SolidAuth: AuthModule = {
    useSession, LoginButton: LoginMultiButton, LogoutButton, SessionProvider, SubscribeButton

}