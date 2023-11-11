import {util} from "@datavillage-me/api";

// TODO get app backend URL from settings
export const BACKEND_URL = new URL("./", window.location.href).toString(); //"http://localhost:5000";

export function getBackendUrl(path: string, params?: Record<string, any>) {
    const url = new URL(path, util.sanitizePath(BACKEND_URL || window.location.href, 'SLASH'));

    params && Object.entries( params).forEach( ([key, value]) => {
        if (value != undefined) url.searchParams.append(key, value);
    })

    //url.searchParams;

    return url.toString();
};
