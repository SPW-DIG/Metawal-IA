import * as React from "react";
import {DEFAULT_AUTH} from "../../auth";

export const Welcome = () => {
    const session = DEFAULT_AUTH.useSession();

    //const podUrl$ = usePromiseFn(async () => session.info.webId ? getPodUrls(session.info.webId, {fetch: session.fetch}).then(urls => urls?.length ? urls[0] : undefined) : undefined, [session.fetch, session.info.webId]);

    return (
        <div>
            <h2>Welcome to the Metawal Personal Dashboard</h2>
            <div>
                This dashboard displays various informations about your personal profile at Metawal, your recommandations and your Solid account.
            </div>
            <br/>
            {session.userId ?
                <div>
                    <div>You are logged in as {session.userId}</div>
                </div> :
                <div>
                    Please log in using Solid
                    <DEFAULT_AUTH.LoginButton/>
                </div>
            }
        </div>
    );
}
