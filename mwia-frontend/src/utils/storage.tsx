import {useMemo} from "react";
import {_404_undefined, handleHttpPromiseStatus, PersonalProfile, PROFILE_PATH} from "@spw-dig/mwia-core";
import {CachedPromiseState, usePromiseFn} from "@datavillage-me/dv-common-ui";
import {MwiaAuth} from "../auth";

export type WritablePromiseState<T> = CachedPromiseState<T> & { update: (value: T) => Promise<void> }

export function useProfile(podUrl?: string, fetchFn?: typeof fetch): WritablePromiseState<PersonalProfile | undefined> {
    const profile$ = usePromiseFn(
        async () => podUrl ?
            await (fetchFn || fetch)(podUrl + PROFILE_PATH).then(handleHttpPromiseStatus).then(resp => resp.json() as Promise<PersonalProfile>).catch(_404_undefined) :
            undefined,
        [fetchFn, podUrl]);

    // WARN this is a hack - the 'update' method should be incoporated in the usePromiseFn  logic
    (profile$ as WritablePromiseState<PersonalProfile | undefined>).update = async (value) => {
        await (fetchFn || fetch)(podUrl + PROFILE_PATH, {
            body: JSON.stringify(value, undefined, 4),
            method: 'PUT',
            headers: {'Content-Type': 'application/json'}
        }).then(handleHttpPromiseStatus);
        profile$.fetch();
        return;
    };

    return profile$ as WritablePromiseState<PersonalProfile | undefined>;
}

export function useStorage(fetchFn?: typeof fetch) {

    const session = MwiaAuth.useSession();
    const f = fetchFn || session.fetch;
    const storage = useMemo(() => ({
        useProfile: () => useProfile(session.podUrl, f)
    }), [f, session.podUrl])

    return storage;
}