import {useSession} from "@inrupt/solid-ui-react";
import * as React from "react";
import {AppContext, LoginMultiButton} from "../../index";
import {TextField} from "@material-ui/core";
import {useCallback, useContext, useState} from "react";
import {DatasetRecommendation} from "@spw-dig/mwia-core";
import {getBackendUrl} from "../../config";
import {Switch as MuiSwitch} from '@material-ui/core';

export const SearchAndRec = () => {
    const {session} = useSession();

    return (
        <div>
            <h2>Recherche</h2>
            <SearchDatasets/>
            <h2>Recommandations</h2>
            {session.info.isLoggedIn ?
                <Recommandations/> :
                <div>
                    Please log in
                    <LoginMultiButton/>
                </div>
            }
        </div>
    );
}

export const SearchDatasets = () => {

    const appCtx = useContext(AppContext);
    const [useProfile, setUseProfile] = useState(false);

    const [recos, setRecos] = useState<DatasetRecommendation[]>([]);

    const search = useCallback(async (searchText: string | undefined | null) => {
        let recos: DatasetRecommendation[] = [];

        if (searchText) {
            const resp = await fetch(getBackendUrl("/recommandations", {force: true, search: searchText, userId: useProfile ? (appCtx.webId || 'https://geoportail.wallonie.be/users/user002') : undefined}));
            recos = (await resp.json()) as DatasetRecommendation[];
        }

        setRecos(recos);
    }, [useProfile]);

    return (
        <div>
            <div>
                <TextField id="outlined-basic" label="Search terms" variant="outlined"   onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        search((e.target as HTMLInputElement).value)
                    }
                }}/>
                <MuiSwitch checked={useProfile} onChange={(event, checked) => setUseProfile(checked)}/> Use Profile
            </div>
            <div>
                {recos.map(reco =>
                    <div><a href={"https://metawal.wallonie.be/geonetwork/srv/fre/catalog.search#/metadata/"+reco.id}>{reco.title}</a> [{reco.score}]</div>
                )}
            </div>
        </div>
    );
}

export const Recommandations = () => {
    return (
        <div>

        </div>
    );
}
