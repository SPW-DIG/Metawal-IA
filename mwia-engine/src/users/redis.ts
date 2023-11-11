import {Graph, RedisClientType} from "redis";
import {HttpUserStorage, User, UsersRegistry, UsersStorage} from "./pds";
import { util } from "@datavillage-me/api";

export class RedisUsersRegistry implements UsersRegistry {

    private redis: RedisClientType;
    private redisGraph: Graph;

    constructor(redis: RedisClientType, graphName: string = "metawalia_users") {
        this.redis = redis;
        this.redisGraph = new Graph(this.redis, graphName);
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

    async getUser(userUri: string) {
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

    async getUserAppStorage(userId: string, fetchFn?: typeof fetch): Promise<UsersStorage> {
        const user = await this.getUser(userId);
        util.assert(user, "User does not exist: "+userId);

        return new HttpUserStorage(userId, user.podUri, fetchFn);
    }
}