import React, {ReactElement, ReactNode} from "react";
import {DatavillageAuth} from "./datavillage";

export * from './solid';
export * from './datavillage';

export type Session = {
    engineApiUrl?: string,
    userId?: string,
    displayName?: string,
    isLoggedIn: boolean,
    podUrl?: string,
    fetch: typeof fetch,
    app? : (
        {
            isRegistered: false
        } |
        {
        isRegistered: true,
        appFolder?: string,
    })
}

export type AuthModule = {
    useSession: () => Session,
    SubscribeButton: React.FC<{ children?: React.ReactElement; }>,
    LoginButton: React.FC<{ children?: React.ReactElement; }>,
    LogoutButton: React.FC<{ children?: React.ReactElement; }>,
    SessionProvider: (props: { children: ReactNode | ((props: {session: Session}) => JSX.Element) }) => ReactElement
}

export const MwiaAuth: AuthModule = DatavillageAuth;