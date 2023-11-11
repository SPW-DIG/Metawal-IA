import * as React from "react";
import {TextField} from "@material-ui/core";
import {useCallback, useState} from "react";
import {DatasetRecommendation} from "@spw-dig/mwia-core";
import {getBackendUrl} from "../../config";
import {Switch as MuiSwitch} from '@material-ui/core';
import {DEFAULT_AUTH} from '../../auth';

const auth = DEFAULT_AUTH;

export const SearchAndRec = () => {
    const session = auth.useSession();

    return (
        <div>
            <h2>Recherche</h2>
            <SearchDatasets/>
            <h2>Recommandations</h2>
            {session.isLoggedIn ?
                <Recommandations/> :
                <div>
                    Please log in
                    <auth.LoginButton/>
                </div>
            }
        </div>
    );
}

export const SearchDatasets = () => {

    const session = auth.useSession();

    const [useProfile, setUseProfile] = useState(false);

    const [recos, setRecos] = useState<DatasetRecommendation[]>([]);

    const search = useCallback(async (searchText: string | undefined | null) => {
        let recos: DatasetRecommendation[] = [];

        if (searchText) {
            const resp = await fetch(getBackendUrl("recommandations", {force: true, search: searchText, userId: useProfile ? session.userId : undefined}));
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
