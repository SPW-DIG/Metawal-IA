import {getResourceInfo} from "@inrupt/solid-client";
import {_404_undefined, grantPublicAccess, handleHttpPromiseStatus} from "../util";
import {
    ContactInfo,
    PersonalProfile
} from "../model";

export const SPW_PATH = "spw/";
export const PROFILE_PATH = SPW_PATH + "profile.json";
export const RECOMMANDATIONS_PATH = SPW_PATH + "recommandations.json";


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

export async function initSpwFolder(podUrl: string, contactInfo: ContactInfo, fetchFn: typeof fetch = fetch) {

    const folder = await getResourceInfo(podUrl + SPW_PATH, {fetch: fetchFn}).catch(err => {
        if (err.response.status == 404) return undefined;
        else throw err;
    });

    if (!folder) {
        await fetchFn(podUrl + SPW_PATH + "README.md", {body: "# Metawal-IA folder", method: 'PUT'});
    }

    await initMetawalProfile(podUrl + PROFILE_PATH,contactInfo,fetchFn);

    await grantPublicAccess(
        podUrl + SPW_PATH,
        fetchFn
    )
}

export async function initMetawalProfile(profileUrl: string, contactInfo: ContactInfo, fetchFn: typeof fetch = fetch, reset?:boolean) {

    const profile = await fetchFn(profileUrl).then(handleHttpPromiseStatus).then(resp => resp.json()).catch(_404_undefined);

    if (!profile || reset) {
        const newProfile = createEmptyProfile(contactInfo);
        await fetchFn(profileUrl, {body: JSON.stringify(newProfile, undefined, 4), method: 'PUT'});
    }
}