import {useSession} from "@inrupt/solid-ui-react";
import {usePromiseFn} from "../../utils/hooks";
import {PromiseStateContainer} from "../../utils/ui-utils";
import * as React from "react";
import {LoginMultiButton} from "../../index";
import {getPodUrls} from "@spw-dig/mwia-core";

export const Welcome = () => {
    const {session} = useSession();

    const podUrl$ = usePromiseFn(async () => session.info.webId ? getPodUrls(session.info.webId, {fetch: session.fetch}).then(urls => urls?.length ? urls[0] : undefined) : undefined, [session.fetch, session.info.webId]);

    return (
        <div>
            <h2>Welcome to the Metawal Personal Dashboard</h2>
            <div>
                This dashboard displays various informations abouit your personal profile at Metawal, your recommandations and your Solid account.
            </div>
            <br/>
            {session.info.isLoggedIn ?
                <div>
                    <div>You are logged in as {session.info.webId}</div>
                    <PromiseStateContainer state={podUrl$}>{(url) =>
                       <div>Your pod URL is ${url}</div>}</PromiseStateContainer>
                </div> :
                <div>
                    Please log in using Solid
                    <LoginMultiButton/>
                </div>
            }
        </div>
    );
}
