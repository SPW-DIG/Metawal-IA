import {DatasetRecommendation, PersonalProfile, PROFILE_PATH, samples, handleHttpPromiseStatus, _404_undefined} from "@spw-dig/mwia-core";
import {Graph, RedisClientType} from "redis";
import fetch from "node-fetch";

export type User = { uri: string, podUri: string };

export interface UsersRegistry {
    getUserProfile(userId: string): Promise<PersonalProfile | undefined>;

    getUserStorage(): UsersStorage;

    registerUser(user: User): Promise<any>;

    getUsers(): Promise<string[]>;

    getUser(userUri: string): Promise<any>;
}

export interface UsersStorage {
    getUserProfile(podUri: string): Promise<PersonalProfile | undefined> ;

    saveRecommandations(podUri: string, recommandations: DatasetRecommendation[]): Promise<void>;
}

/**
 * Dummy in-memory implementation for test purposes
 */
export class DummyUsersRegistry implements UsersRegistry, UsersStorage {

    private users = {
        [samples.LambdaUser1.uri] : samples.LambdaUser1,
        [samples.LambdaUser2.uri] : samples.LambdaUser2,
    }

    saveRecommandations(podUri: string, recommandations: DatasetRecommendation[]): Promise<void> {
        throw new Error("Not implemented")
    }

    getUserStorage(): UsersStorage {
        return this;
    }

    async getUserProfile(podUri: string): Promise<PersonalProfile | undefined> {
        return this.users[podUri];
    }

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


export class RedisUsersRegistry implements UsersRegistry {

    private redis: RedisClientType;
    private redisGraph: Graph;
    private userStorage: UsersStorage;

    constructor(redis: RedisClientType, graphName: string = "metawalia_users") {
        this.redis = redis;
        this.redisGraph = new Graph(this.redis, graphName);
        this.userStorage = new SolidUserStorage();
    }

    async registerUser(user: User) {
        let mergeQuery = `
        MERGE (user:User {uri:'${user.uri}', podUri:'${user.podUri}'})
        `;

        return this.redisGraph.query(mergeQuery).catch(err => {
            console.warn(`Cypher query failed : ${err} \n>>> ${mergeQuery}`);
            throw err;
        });
    }

    async getUsers(): Promise<string[]> {
        let query = `
        MATCH (user:User)
        RETURN user.uri as uri
        `;

        const reply = await this.redisGraph.query<{ uri: string }>(query).catch(err => {
            console.warn(`Cypher query failed : ${err} \n>>> ${query}`);
            throw err;
        });

        return reply.data ? reply.data.map(u => u.uri) : [];
    }

    async getUser(userUri: string): Promise<any | undefined> {
        let query = `
        MATCH (user:User {uri:'${userUri}'})
        RETURN user
        `;

        const reply = await this.redisGraph.query<{user: {properties: User}}>(query).catch(err => {
            console.warn(`Cypher query failed : ${err} \n>>> ${query}`);
            throw err;
        });

        return reply.data && reply.data.length ? reply.data[0].user.properties : undefined;
    }

    async getUserProfile(userId: string): Promise<PersonalProfile | undefined> {
        const user = await this.getUser(userId);

        const profile = user && await this.userStorage.getUserProfile(user.podUri);

        return profile && {...profile, uri: userId};
    }

    getUserStorage(): UsersStorage {
        return this.userStorage;
    }
}

export class SolidUserStorage implements UsersStorage {
    async getUserProfile(podUri: string): Promise<PersonalProfile | undefined> {

        const profile = await fetch(podUri+PROFILE_PATH)
            // @ts-ignore  // there's a type discrepancy between node-fetch fetch signature and the plain DOM
            .then(handleHttpPromiseStatus)
            .then(resp => resp.json() as Promise<PersonalProfile>).catch(_404_undefined);
        return profile;
    }

    async saveRecommandations(podUri: string, recommandations: DatasetRecommendation[]): Promise<void> {

    }
}