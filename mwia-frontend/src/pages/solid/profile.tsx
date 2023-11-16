import * as React from "react";
import {handleHttpPromiseStatus, initMetawalProfile, PROFILE_PATH, _404_undefined} from "@spw-dig/mwia-core";
import {lazy, Suspense, useCallback, useEffect, useState} from "react";
import {Button, Switch} from "@mui/material";
import {useStorage} from "../../utils/storage";
import { PromiseStateContainer } from "@datavillage-me/dv-common-ui";
import { ErrorBoundary } from "../../utils/ui-utils";

export function Profile(props: { podUrl: string, fetch: typeof fetch }) {
    const [useRaw, setUseRaw] = useState(false);

    return <div>
        <h1>Profile <Switch value={useRaw} onChange={(e) => setUseRaw(e.currentTarget.checked)} aria-label={"Raw Edit"}/></h1>
        {useRaw ? <RawProfileEditor profileUrl={props.podUrl + PROFILE_PATH} fetch={props.fetch}/> : <div> <ProfileEditor /> </div>}
    </div>
}

export const ProfileEditor = () => {

    const storage = useStorage();
    const profile$ = storage.useProfile();

    return <div>
        <PromiseStateContainer promiseState={profile$!}>
            {(profile) => profile ? <div>
                <h2>History</h2>
                {profile.browseHistory.map(i => <div>{i.datasetUri}</div>)}
            </div> : null}
        </PromiseStateContainer>
    </div>
}


export const RawProfileEditor = (props: { profileUrl: string, fetch: typeof fetch }) => {

    const [profileStr, setProfileStr] = useState<string>();
    const [editedStr, setEditedStr] = useState<string>();

    useEffect(() => {
        props.fetch(props.profileUrl).then(handleHttpPromiseStatus).then(resp => resp.text()).catch(_404_undefined).then(text => {setProfileStr(text); setEditedStr(text)})
    }, [props.fetch, props.profileUrl]);

    const saveProfile = useCallback((str) => {
        return props.fetch(props.profileUrl, {method: 'PUT', body: str});
    }, [props.fetch, props.profileUrl]);

    const MonacoEditor = lazy(() => import('../../utils/monaco').then(module => ({default: module.MonacoEditor})));

    return <div>
        Displaying profile at {props.profileUrl}<br/>
        <Button variant="contained" disabled={profileStr == editedStr} color="secondary" onClick={() => saveProfile(editedStr).then(() => {setProfileStr(editedStr)})}>Save</Button>
        <Button variant="contained" color="primary" onClick={() => initMetawalProfile(props.profileUrl, {name: "New User"} , props.fetch, true)}>Reset</Button>
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorBoundary>
                <MonacoEditor text={profileStr || ''} language="json" onChange={setEditedStr}/>
            </ErrorBoundary>
        </Suspense>
    </div>
};