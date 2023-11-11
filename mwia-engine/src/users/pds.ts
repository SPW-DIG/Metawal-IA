import { util } from "@datavillage-me/api";
import {
    DatasetRecommendation,
    PersonalProfile,
    PROFILE_PATH,
    handleHttpPromiseStatus,
    _404_undefined,
    initSpwFolder, ContactInfo
} from "@spw-dig/mwia-core";
import nodefetch from "node-fetch";

export type User = { uri: string, podUri: string };

export interface UsersRegistry {
    registerUser(user: User): Promise<any>;

    getUsers(): Promise<string[]>;

    getUserAppStorage(userId: string, fetchFn?: typeof fetch): Promise<UsersStorage>;
}

export interface UsersStorage {
    resetStorage(contactInfo: ContactInfo): Promise<void> ;

    getUserProfile(): Promise<PersonalProfile | undefined> ;

    saveRecommandations(recommandations: DatasetRecommendation[]): Promise<void>;
}


export class HttpUserStorage implements UsersStorage {

    private userUri: string;
    private fetchFn: typeof fetch;
    private appFolderUri: string;

    // @ts-ignore  // there's a type discrepancy between node-fetch fetch signature and the plain DOM
    constructor(userUri: string, appFolderUri: string, fetchFn: typeof fetch = nodefetch) {
        util.assert(appFolderUri.endsWith('/'), "App folder must end with a slash : "+appFolderUri);

        this.userUri = userUri;
        this.appFolderUri = appFolderUri;
        this.fetchFn = fetchFn;
    }

    async getUserProfile(): Promise<PersonalProfile | undefined> {
        const profile = await this.fetchFn(this.appFolderUri+PROFILE_PATH)
            .then(handleHttpPromiseStatus)
            .then(resp => resp.json()).then(profile => ({...profile, uri: this.userUri} as PersonalProfile)).catch(_404_undefined);
        return profile;
    }

    async saveRecommandations(recommandations: DatasetRecommendation[]): Promise<void> {

    }

    async resetStorage(contactInfo: ContactInfo) {
        await initSpwFolder(this.appFolderUri, contactInfo, this.fetchFn);
    }
}