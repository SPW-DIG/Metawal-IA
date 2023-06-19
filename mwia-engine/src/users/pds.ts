import {PersonalProfile} from "@spw-dig/mwia-core";
import {samples}  from "@spw-dig/mwia-core";

export interface UsersRegistry {
    getUserProfile(userId: string): PersonalProfile | undefined
}

export class DummyUsersRegistry implements UsersRegistry {

    private users = {
        [samples.LambdaUser1.uri] : samples.LambdaUser1,
        [samples.LambdaUser2.uri] : samples.LambdaUser2,
    }

    getUserProfile(userId: string): PersonalProfile | undefined {
        return this.users[userId];
    }
}