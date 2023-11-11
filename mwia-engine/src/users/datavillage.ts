import {HttpUserStorage, User, UsersRegistry, UsersStorage} from "./pds";
import {RemoteClient, util} from "@datavillage-me/api";

export class DatavillageUsersRegistry implements UsersRegistry {

    private client: RemoteClient;
    private clientId: string;
    private appId: string;

    constructor(client: RemoteClient, clientId: string, appId: string) {
        this.client = client;
        this.clientId = clientId;
        this.appId = appId;
    }

    async registerUser(user: User) {
        // when hosted by Datavillage, user registration is done by the platform
    }

    async getUsers(): Promise<string[]> {
        return this.client.getClientsServices().getApplicationActiveUsers(this.clientId, this.appId);
    }

    async getUserAppStorage(userId: string, fetchFn?: typeof fetch): Promise<UsersStorage> {
        const dvApiUrl = util.sanitizePath(this.client.httpClient.getUrl(), "SLASH");
        const appDataUri = dvApiUrl + `collaborationSpaces/${this.appId}/users/${userId}/appdata/`

        fetchFn = fetchFn || ((input, init) => {
            if (typeof input != 'string') {
                throw new Error('fetch on non-string URL not supported');
            }
            return this.client.httpClient.authorizedFetch(input, init, true)
        })

        return new HttpUserStorage(userId, appDataUri, fetchFn);
    }
}