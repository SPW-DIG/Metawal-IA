import {MwiaAuth} from "../auth";
import { httputil, util } from "@datavillage-me/api";
import {DatasetRecommendation} from "@spw-dig/mwia-core";
import {useMemo} from "react";

export function getBackendUrl(apiUrl: string | undefined, path: string, params?: Record<string, any>) {
    const url = new URL(path, util.sanitizePath(apiUrl || window.location.href, 'SLASH'));

    params && Object.entries( params).forEach( ([key, value]) => {
        if (value != undefined) url.searchParams.append(key, value);
    })

    //url.searchParams;

    return url.toString();
};

export function useBackend() {
    const {engineApiUrl} = MwiaAuth.useSession();

    return useMemo( () => {
        return {
            getUser: (userUri: string) => {
                fetch(getBackendUrl(engineApiUrl, "user", {userUri}).toString()).then(httputil.handleHttpPromiseStatus).then(resp => resp.json()).catch(httputil._404_undefined)
            },

            registerUser: async (webId: string, podUrl: string) => {
                await fetch(getBackendUrl(engineApiUrl, "user/register", {userUri: webId, podUri: podUrl}).toString(),{method: 'POST'});
            },

            syncCatalog: async () => {
                const url = getBackendUrl(engineApiUrl, "admin/graph/sync");
                const resp = await fetch(url, {method: 'POST'});
                return resp.text();
            },

            getStats: async () => {
                const url = getBackendUrl(engineApiUrl, "admin/graph/stats");
                const resp = await fetch(url);
                return await resp.json() as {
                    datasets: number,
                    lastSync: number
                }
            },

            search: async (searchText: string, userId?: string) => {
                const resp = await fetch(getBackendUrl(engineApiUrl, "recommandations", {force: true, search: searchText, userId}));
                const recos = (await resp.json()) as DatasetRecommendation[];

                return recos;
            }
        }
    }, [engineApiUrl])


}