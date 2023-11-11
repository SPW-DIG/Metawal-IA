import {ContactInfo, DatasetRecommendation, samples} from "@spw-dig/mwia-core/dist/cjs/model";
import {User, UsersRegistry} from "./pds";

/**
 * Dummy in-memory implementation for test purposes
 */
export class DummyUsersRegistry implements UsersRegistry {

    private users = {
        [samples.LambdaUser1.uri] : samples.LambdaUser1,
        [samples.LambdaUser2.uri] : samples.LambdaUser2,
    }


    async getUserAppStorage(userId: string, fetchFn?: typeof fetch) {
        return {
            resetStorage: async (contactInfo: ContactInfo) => undefined,

            getUserProfile: async () => this.users[userId],

            saveRecommandations: (recommandations: DatasetRecommendation[]) =>  {throw new Error("Not implemented")}
        }
    };

    async getUsers(): Promise<string[]> {
        return Object.keys(this.users);
    }

    async getUser(userUri: string): Promise<any> {
        return this.users[userUri];
    }

    registerUser(user: User): Promise<any> {
        throw new Error("Not implemented")
    }
}