import {util} from "@datavillage-me/api";

export const BACKEND_URL = ""; //http://localhost:5000";

export function getBackendUrl(path: string, params?: Record<string, any>) {
    const url = new URL(path, util.sanitizePath(BACKEND_URL || window.location.href, 'SLASH'));

    params && Object.entries( params).forEach( ([key, value]) => {
        if (value != undefined) url.searchParams.append(key, value);
    })

    //url.searchParams;

    return url;
};
