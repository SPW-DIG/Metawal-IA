import {getResourceInfo} from "@inrupt/solid-client";
import {_404_undefined, handleHttpPromiseStatus} from "../util";
import {
    ContactInfo,
    PersonalProfile
} from "../model";

export const PROFILE_PATH = "profile.json";
export const RECOMMANDATIONS_PATH = "recommandations.json";


export type PodPersonalProfile = Omit<PersonalProfile, 'uri'>;

export const createEmptyProfile = (contactInfo: ContactInfo): PodPersonalProfile => ({
    contactInfo,

    userCategories: [],

    tagsOfInterest: [],

    lastVisit: new Date().toISOString(),

    searchHistory: [],

    browseHistory: [],

    downloadHistory: [],

    savedMaps: []
})

export async function initSpwFolder(folderUrl: string, contactInfo: ContactInfo, fetchFn: typeof fetch = fetch) {

    const folder = await getResourceInfo(folderUrl, {fetch: fetchFn}).catch(err => {
        if (err.response.status == 404) return undefined;
        else throw err;
    });

    if (!folder) {
        await fetchFn(folderUrl + "README.md", {body: "# Metawal-IA folder", method: 'PUT'});
    }

    await initMetawalProfile(folderUrl + PROFILE_PATH,contactInfo,fetchFn);

    /*  TODO should there be some specific rights set on folder at init ?
    await grantPublicAccess(
        folderUrl,
        fetchFn
    )

     */
}

export async function initMetawalProfile(profileUrl: string, contactInfo: ContactInfo, fetchFn: typeof fetch = fetch, reset?:boolean) {

    const profile = await fetchFn(profileUrl).then(handleHttpPromiseStatus).then(resp => resp.json()).catch(_404_undefined);

    if (!profile || reset) {
        const newProfile = createEmptyProfile(contactInfo);
        await fetchFn(profileUrl, {body: JSON.stringify(newProfile, undefined, 4), method: 'PUT'});
    }
}