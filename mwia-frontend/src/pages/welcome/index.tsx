import * as React from "react";
import {AppContext, LoginMultiButton} from "../../index";
import {useContext} from "react";

export const Welcome = () => {
    const appCtx = useContext(AppContext);

    //const podUrl$ = usePromiseFn(async () => session.info.webId ? getPodUrls(session.info.webId, {fetch: session.fetch}).then(urls => urls?.length ? urls[0] : undefined) : undefined, [session.fetch, session.info.webId]);

    return (
        <div>
            <h2>Welcome to the Metawal Personal Dashboard</h2>
            <div>
                This dashboard displays various informations abouit your personal profile at Metawal, your recommandations and your Solid account.
            </div>
            <br/>
            {appCtx.webId ?
                <div>
                    <div>You are logged in as {appCtx.webId}</div>
                    <div>Your pod URL is {appCtx.podUrl}</div>
                </div> :
                <div>
                    Please log in using Solid
                    <LoginMultiButton/>
                </div>
            }
        </div>
    );
}
