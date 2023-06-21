import {useEffect, useRef, useState} from 'react';

export type PromiseState<R> =
    | { done: false; result?: undefined; error?: undefined }
    | ({ done: true } & ({ success: true; result: R; error?: undefined } | { success: false; error: any; result?: undefined }));

export function usePromise<R>(promise: Promise<R> | undefined): PromiseState<R> {
    const [state, setState] = useState<PromiseState<R>>({done: false});

    const [prevPromise, setPrevObs] = useState<Promise<R> | undefined>(promise);

    if (prevPromise !== promise) {
        setState({done: false});
        setPrevObs(promise);
    }

    useEffect(() => {
        promise?.then(
            r => {
                setState({done: true, success: true, result: r});
            },
            reason => {
                setState({done: true, success: false, error: reason});
            }
        );
    }, [promise]);

    return state;
}

export function shallowEqual(objA: any, objB: any) {
    if (Object.is(objA, objB)) {
        return true;
    }

    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
        return false;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    for (let i = 0; i < keysA.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || !Object.is(objA[keysA[i]], objB[keysA[i]])) {
            return false;
        }
    }

    return true;
}

export function useRefMemo<R>(createFn: () => R, deps: any[]): R {
    const ref = useRef<any[]>();
    const memoizedValue = useRef<R>();
    // if ref.current == undefined, memoizedValue has not been initialized yet
    if (ref.current == undefined || !shallowEqual(deps, ref.current)) {
        ref.current = deps;
        memoizedValue.current = createFn();
    }

    return memoizedValue.current as R;
}

export function usePromiseFn<P, R>(createFn: () => Promise<R> | undefined, deps: any[]): PromiseState<R> {
    const promise$: Promise<R> | undefined = useRefMemo(() => createFn(), deps);

    return usePromise<R>(promise$);
}
