import * as React from "react";
import {TextField} from "@mui/material";
import {useCallback, useState} from "react";
import {DatasetRecommendation} from "@spw-dig/mwia-core";
import {Switch as MuiSwitch} from '@mui/material';
import {MwiaAuth} from "../../auth";
import {useBackend} from "../../utils/engine";

export const SearchAndRec = () => {
    const session = MwiaAuth.useSession();

    return (
        <div>
            <h2>Recherche</h2>
            <SearchDatasets/>
            <h2>Recommandations</h2>
            {session.isLoggedIn ?
                <Recommandations/> :
                <div>
                    Please log in
                    <MwiaAuth.LoginButton/>
                </div>
            }
        </div>
    );
}

export const SearchDatasets = () => {

    const session = MwiaAuth.useSession();
    const backend = useBackend();

    const [useProfile, setUseProfile] = useState(false);

    const [recos, setRecos] = useState<DatasetRecommendation[]>([]);

    const search = useCallback(async (searchText: string | undefined | null) => {
        const recos = searchText ?
            await backend.search(searchText, useProfile ? session.userId : undefined) :
            [];
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
