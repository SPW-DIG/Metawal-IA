import {getLogger} from "log4js";
import {NextFunction, Request, Response} from "express";

const log_http = getLogger('http');

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

export class UndefinedError extends Error {
    constructor(message?: string) {
        super(message || 'Undefined');
    }
}

export class WrappedError extends Error {
    private readonly cause: Error | undefined;

    constructor(message?: string, cause?: Error) {
        super(message || 'Undefined');

        this.cause = cause;
    }

    getCause(): Error | undefined {
        return this.cause;
    }
}

export function processError(err: any, msgPrefix?: string): HttpError {
    if (err instanceof UndefinedError) {
        return new HttpError(404, (msgPrefix || '') + err.message);
    } else if (typeof err == 'string') {
        return new HttpError(500, (msgPrefix || '') + err);
    } else if (err instanceof HttpError || (typeof err == 'object' && err.status !== undefined && err.msg !== undefined)) {
        // TODO using 'instanceof HttpError' is not reliable. Why ? is this the best way to check ?
        // let's assume this is a HttpError
        return msgPrefix ? new HttpError(err.status, msgPrefix + err.msg) : err;
    } else {
        // legacy
        return new HttpError(err.statusCode || err.status || 500, (msgPrefix || '') + (err.message || JSON.stringify(err)));
    }
}

export const ErrorHandler = (err: any, req: Request, res: Response, next?: NextFunction) => {
    if (err) {
        const httpError = processError(err);

        if (httpError.status >= 500) {
            log_http.error(httpError.toString());
            log_http.error('Original error : ', err);
            if (err instanceof WrappedError) log_http.error('Original error : ', err.getCause());
        } else {
            log_http.warn(httpError.toString());
            log_http.debug('Original error : ', err);
            if (err instanceof WrappedError && log_http.isDebugEnabled()) log_http.error('Original error : ', err.getCause());
        }

        res.status(httpError.status);

        if (req.headers['accept'] == 'application/json') {
            res.json({
                message: httpError.message
            });
        } else {
            // TODO handle 401 with a redirect ?
            res.send(httpError.message);
        }
    }
};