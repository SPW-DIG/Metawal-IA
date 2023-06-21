import { ValidationError } from './errors';

export function assert(val: any, msg?: string): asserts val {
    if (!val) throw new ValidationError(msg || 'Assertion failed : ' + val);
}

/**
 * Assert that all properties of an object are defined.
 * This tests against [undefined, null, EMPTY_STRING], i.e. properties can be boolean false or 0 .
 *
 * The function acts as a type assertion, narrowing the properties of the passed object, *IF* said object
 * is typed per property, and not a generic map, i.e.
 * ```
 *   obj: {foo: string | undefined, bar: number | undefined}
 * ```
 * will be narrowed to
 * ```
 *   obj: {foo: string, bar: number}
 * ```
 *
 * but
 * ```
 *   obj: {[key: string]: any}
 * ```
 * will not
 */
export function assertObject<T extends { [key: string]: any }>(
    obj: T,
    messagePrefix: string = ''
): asserts obj is { [key in keyof T]: Exclude<T[key], undefined | null | ''> } {
    for (const key in obj) {
        if (obj.hasOwnProperty(key))
            assert(!(obj[key] == undefined || obj[key] == null || obj[key] == ''), `${messagePrefix}Missing property [${key}]`);
    }
}

export function tryConst<T, U>(valueFn: () => T, catchFn: (err: any) => U): T | U;
export function tryConst<T, U>(valueFn: () => T): T;
export function tryConst<T, U>(valueFn: () => T, catchFn?: (err: any) => U): T | U {
    try {
        return valueFn();
    } catch (e) {
        if (catchFn) return catchFn(e);
        else throw e;
    }
}
