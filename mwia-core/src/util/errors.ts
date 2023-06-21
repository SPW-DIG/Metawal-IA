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

export class UndefinedError extends Error {
    constructor(message?: string) {
        super(message || 'Undefined');
    }
}

export class ValidationError extends WrappedError {
    constructor(message: string, cause?: Error) {
        super(message, cause);
    }
}

/**
 * Promise handler that chokes on undefined or null values
 * @param msg
 */
export function throwOnUndefined<T>(msg?: string) {
    return (value: T | undefined | null): T => {
        if (value == undefined || value == null) throw new UndefinedError(msg);
        return value;
    };
}

export function catchUndefined(error: Error) {
    if (error instanceof UndefinedError) {
        return undefined;
    } else {
        throw error;
    }
}
