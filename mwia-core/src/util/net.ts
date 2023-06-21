
export class HttpError extends Error {
    status: number;

    constructor(status: number, msg: string) {
        super(msg);
        this.status = status;
    }

    toString() {
        return `HTTP [${this.status}] ${this.message}`;
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message?: string) {
        super(401, message || 'Unauthorized');
    }
}

export class ForbiddenError extends HttpError {
    constructor(message?: string) {
        super(403, message || 'Forbidden');
    }
}

export class NotFoundError extends HttpError {
    constructor(message?: string) {
        super(404, message || 'Not found');
    }
}

export async function getErrorObject(res: Response): Promise<HttpError> {
    const errTxt = await res.text();
    try {
        const errJson = JSON.parse(errTxt);
        return new HttpError(res.status, errJson.message || res.statusText);
    } catch (e) {
        // apparently not json
        return new HttpError(res.status, errTxt || res.statusText);
    }
}

export async function handleHttpPromiseStatus(res: Response): Promise<Response> {
    // TODO handle 3** codes (considered as NOK as per fetch)
    if (res.ok) {
        const originalJsonFn = res.json;
        // override json parsing fn to handle 204 status
        res.json = async function () {
            if (this.status == 204)
                // what if status == 204 *and* there's json content
                return undefined;
            else return originalJsonFn.call(this);
        };
        return res;
    } else {
        const err = await getErrorObject(res);
        throw err;
    }
}


export function safeFetch(fetchFn: typeof fetch = fetch) {
    return (...args: Parameters<typeof fetch>) => fetchFn(...args).then(handleHttpPromiseStatus);
}
