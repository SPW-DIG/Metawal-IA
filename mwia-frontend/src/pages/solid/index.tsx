import * as React from "react";
import {Box, Button, Tab, Tabs} from "@material-ui/core";
import {useSession} from "@inrupt/solid-ui-react";
import {usePromiseFn} from "../../utils/hooks";
import {PromiseFnContainer, PromiseStateContainer} from "../../utils/ui-utils";
import { universalAccess } from "@inrupt/solid-client";
import {MonacoEditor} from "../../utils/monaco";
import {getPodUrls} from "@spw-dig/mwia-core";


const PROFILE_PATH = "spw/profile.ttl";

async function createTestFile(path: string, content: string, fetchFn: typeof fetch = fetch) {
    await fetchFn(path, {method: 'PUT', headers: {'Content-Type': 'text/plain'}, body: content});
}

async function grantTestAccess(path: string, fetchFn: typeof fetch = fetch) {
    universalAccess.setPublicAccess(
        path,
        { read: true, write: true },
        { fetch: fetchFn }
    )
}

async function getPublicAccess(path: string | undefined, fetchFn: typeof fetch = fetch) {
    return path && universalAccess.getPublicAccess(
        path,
        { fetch: fetchFn }
    )
}


/**
 * sends a request to the specified url from a form. this will change the window location.
 * @param {string} path the path to send the post request to
 * @param {object} params the parameters to add to the url
 * @param {string} [method=post] the method to use on the form
 */

function post(path: string, params: any, method='post') {

    // The rest of this code assumes you are not using a library.
    // It can be made less verbose if you use one.
    const form = document.createElement('form');
    form.method = method;
    form.action = path;

    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = params[key];

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}


function TabPanel(props: {
    children?: React.ReactNode;
    index: number;
    value: number;
}) {
    const { children, value, index, ...other } = props;

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


export const SolidDashboard = () => {

    const {session} = useSession();

    //const idDoc = usePromiseFn(async () => session.info.webId ? session.fetch(session.info.webId, {headers: {'Accept': 'text/turtle'}}) : undefined, [session.fetch, session.info.webId]);

    const podUrls$ = usePromiseFn(async () => session.info.webId ? getPodUrls(session.info.webId, {fetch: session.fetch}) : undefined, [session.fetch, session.info.webId]);

    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    function a11yProps(index: number) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }

    return <div>
        <PromiseStateContainer state={podUrls$}>{(urls) => <>
            <Box style={{margin: '0px -10px', marginBottom: '15px'}}>
                <Tabs value={value} TabIndicatorProps={{style: {backgroundColor: 'black'}}} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Recommandations" {...a11yProps(0)} />
                    <Tab label="Profile" {...a11yProps(1)} />
                    <Tab label="Tests" {...a11yProps(2)} />
                </Tabs>
            </Box>

            <TabPanel value={value} index={0}>
                <h1>Recommandations</h1>

            </TabPanel>

            <TabPanel value={value} index={1}>
                <h1>Profile</h1>
                <Button variant="contained" color="primary" onClick={() => post("/epc/grantAccess", {webId: 'https://id.sandbox-pod.datanutsbedrijf.be/a1oqggeaa32j5cmz933smco4znrvgcz1oh6j', epcUri: 'https://storage.sandbox-pod.datanutsbedrijf.be/9732713a-eb64-40d1-b948-a4ce6045351f/energy'})}>
                    Grant Access
                </Button>
                {urls ? <ProfileEditor profileUrl={urls[0]+PROFILE_PATH} fetch={session.fetch}/> : null}
            </TabPanel>

            <TabPanel value={value} index={2}>
                <h1>Tests</h1>
                <button onClick={() => urls && createTestFile(urls[0]+"test/test.txt", `Test Content ${new Date().toISOString()}`, session.fetch)}>Create Test file</button>
                <button onClick={() => urls && grantTestAccess(urls[0]+"test/test.txt", session.fetch)}>Grant Test Access</button>

                <PromiseFnContainer promiseFn={() => getPublicAccess(urls && (urls[0]+"test/test.txt"), session.fetch)} deps={[urls, session.fetch]}>
                    {result => <div>
                        {JSON.stringify(result)}
                    </div>}
                </PromiseFnContainer>

                <div>
                    <h2>Current Test File</h2>
                    {urls ? <FileContent url={urls[0]+"test/test.txt"} fetch={session.fetch}/> : null}
                </div>
            </TabPanel>

        </>}</PromiseStateContainer>

    </div>

};


export const ProfileEditor = (props: { profileUrl: string, fetch: typeof fetch }) => {

    const profile$ = usePromiseFn(async () => props.fetch(props.profileUrl).then(resp => resp.text()), [props.fetch, props.profileUrl]);

    return <div>
        {profile$.done ? 'Displaying' : 'Fetching'} Profile at {props.profileUrl} <Button onClick={() => null /* TODO */}>Add EPC data</Button>
        <PromiseStateContainer state={profile$}>
            {(profile) => profile ? <MonacoEditor text={profile}/> : null}
        </PromiseStateContainer></div>


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
