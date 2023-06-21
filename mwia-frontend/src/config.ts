export const BACKEND_URL = "http://localhost:5000";

export function getBackendUrl(path: string, params?: Record<string, any>) {
    const url = new URL(path, BACKEND_URL || window.location.href);

    params && Object.entries( params).forEach( ([key, value]) => {
        url.searchParams.append(key, value);
    })

    //url.searchParams;

    return url;
};
