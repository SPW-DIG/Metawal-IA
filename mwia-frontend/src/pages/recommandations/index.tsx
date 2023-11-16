import * as React from "react";
import {TextField} from "@mui/material";
import {useCallback, useState} from "react";
import {DatasetRecommendation, Cause} from "@spw-dig/mwia-core";
import {Switch as MuiSwitch} from '@mui/material';
import {MwiaAuth} from "../../auth";
import {useBackend} from "../../utils/engine";
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {useStorage} from "../../utils/storage";

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

    const storage = useStorage();
    const profile = storage.useProfile();
    const history = profile?.result?.browseHistory || [];

    const setFavorite = useCallback( (datasetUri: string, checked: boolean) => {
        if (profile?.result) {
            const existingIdx = profile.result.browseHistory.findIndex((i) => i.datasetUri == datasetUri);
            if (checked) {
                if (existingIdx < 0) {
                    profile.result.browseHistory.push({datasetUri, timestamp: new Date().toISOString()});
                    profile.update(profile.result);
                }
            } else {
                if (existingIdx >= 0) {
                    profile.result.browseHistory.splice(existingIdx, 1);
                    profile.update(profile.result);
                }
            }
        }
    }, [
        profile
    ]);

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
                {recos.map(reco => <Recommandation reco={reco} favorites={history} onSetFavorite={(checked) => setFavorite(reco.datasetUri, checked)}/>)}
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


export const Recommandation = (props: {reco: DatasetRecommendation, favorites?: {datasetUri: string}[], onSetFavorite?: (checked: boolean) => void, showCauses?: boolean}) => {
    const [showCauses, setShowCauses] = useState(props.showCauses);

    return (
        <div>
            {props.favorites ?
                <span style={{verticalAlign: 'text-top', color: '#7b0707'}}> {
                (props.favorites.find(f => f.datasetUri == props.reco.datasetUri) ?
                    <FavoriteIcon fontSize='inherit' onClick={() => props.onSetFavorite && props.onSetFavorite(false)}/> :
                    <FavoriteBorderIcon fontSize='inherit' onClick={() => props.onSetFavorite && props.onSetFavorite(true)}/> )}
                    </span> :
                null}
            <a href={"https://metawal.wallonie.be/geonetwork/srv/fre/catalog.search#/metadata/"+props.reco.id}>{props.reco.title}</a> [{props.reco.score}] <span onClick={() => setShowCauses(!showCauses)}>?</span>
            <div style={{display: showCauses ? undefined : 'none'}}>
                {props.reco.causes?.map (c => <CauseDisplay cause={c}/>)}
            </div>
        </div>
    );
}

export const CauseDisplay = ({cause}: {cause: Cause}) => {

    switch (cause.type) {
        case 'fulltext' :
            return <span className='cause-fulltext'>Text Search</span>
        case 'concept' :
            return <span className='cause-concept'><a href={cause.uri}>{cause.title}</a></span>
        case 'resource' :
            return <span className='cause-resource'><a href={cause.uri}>{cause.title}</a></span>
        default:
            return <span>{JSON.stringify(cause)}</span>;
    }
}
