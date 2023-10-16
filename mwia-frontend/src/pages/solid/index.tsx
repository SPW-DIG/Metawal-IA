import * as React from "react";
import {Box, Tab, Tabs} from "@material-ui/core";
import {useSession} from "@inrupt/solid-ui-react";
import {usePromiseFn} from "../../utils/hooks";
import {PromiseFnContainer, PromiseStateContainer} from "../../utils/ui-utils";
import {assert, getPublicAccess, grantPublicAccess} from "@spw-dig/mwia-core";
import {Profile} from "./profile";
import {useContext} from "react";
import {AppContext} from "../../index";
import {initSpwFolder} from "@spw-dig/mwia-core";
import {getBackendUrl} from "../../config";

async function createTestFile(path: string, content: string, fetchFn: typeof fetch = fetch) {
    await fetchFn(path, {method: 'PUT', headers: {'Content-Type': 'text/plain'}, body: content});
}

function TabPanel(props: {
    children?: React.ReactNode;
    index: number;
    value: number;
}) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}


async function registerUser(webId: string, podUrl: string, fetchFn: typeof fetch) {
    await fetch(getBackendUrl("user/register", {userUri: webId, podUri: podUrl}).toString(),{method: 'POST'});

    await initSpwFolder(podUrl, {name: "New User"}, fetchFn);
}

export const SolidDashboard = () => {

    const {session} = useSession();
    const appCtx = useContext(AppContext);

    assert(appCtx.podUrl);

    //const idDoc = usePromiseFn(async () => session.info.webId ? session.fetch(session.info.webId, {headers: {'Accept': 'text/turtle'}}) : undefined, [session.fetch, session.info.webId]);

    const [value, setValue] = React.useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return <div>
        {!appCtx.registeredUser ?
            <button onClick={() => registerUser(appCtx.webId!, appCtx.podUrl!, session.fetch)}>
                Souscrire au service Metawal-IA
            </button> :
            !appCtx.accessGranted ? // This should be done already, but in case the pod is in broken state
                    <button onClick={() => initSpwFolder(appCtx.podUrl!, {name: "New User"}, session.fetch)}>
                        Autoriser l'utilisation du pod pour la génération de recommandations
                    </button>:
                <>
                    <Box style={{margin: '0px -10px', marginBottom: '15px'}}>
                        <Tabs value={value} TabIndicatorProps={{style: {backgroundColor: 'black'}}}
                              onChange={handleTabChange}
                              aria-label="basic tabs example">
                            <Tab label="Profile" {...a11yProps(0)} />
                            <Tab label="Recommandations" {...a11yProps(1)} />
                            <Tab label="Tests" {...a11yProps(2)} />
                        </Tabs>
                    </Box>

                    <TabPanel value={value} index={0}>
                        <Profile podUrl={appCtx.podUrl} fetch={session.fetch}/>
                    </TabPanel>

                    <TabPanel value={value} index={1}>
                        <h1>Recommandations</h1>
                    </TabPanel>

                    <TabPanel value={value} index={2}>
                        <h1>Tests</h1>
                        <button
                            onClick={() => appCtx.podUrl && createTestFile(appCtx.podUrl + "test/test.txt", `Test Content ${new Date().toISOString()}`, session.fetch)}>Create
                            Test file
                        </button>
                        <button
                            onClick={() => appCtx.podUrl && grantPublicAccess(appCtx.podUrl + "test/test.txt", session.fetch)}>Grant
                            Test
                            Access
                        </button>

                        <PromiseFnContainer
                            promiseFn={() => getPublicAccess(appCtx.podUrl && (appCtx.podUrl + "test/test.txt"), session.fetch)}
                            deps={[appCtx.podUrl, session.fetch]}>
                            {result => <div>
                                {JSON.stringify(result)}
                            </div>}
                        </PromiseFnContainer>

                        <div>
                            <h2>Current Test File</h2>
                            {appCtx.podUrl ? <FileContent url={appCtx.podUrl + "test/test.txt"} fetch={session.fetch}/> : null}
                        </div>
                    </TabPanel>
                </>}

    </div>

};


export const FileContent = (props: { url: string, fetch: typeof fetch }) => {

    const doc$ = usePromiseFn(async () => props.fetch(props.url).then(resp => resp.text()), [props.fetch, props.url]);

    return <div>
        {doc$.done ? 'Displaying' : 'Fetching'} resource at {props.url}
        <PromiseStateContainer state={doc$}>
            {(doc) => <pre>
                {doc}
            </pre>}
        </PromiseStateContainer></div>


};
