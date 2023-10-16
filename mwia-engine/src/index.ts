import {RedisQueue} from "./redis";
import {createClient, RedisClientType} from "redis";
import {KnowledgeGraph} from "./engine/graph";
import {DummyCatalogClient} from "./catalog/catalog";
import {RedisUsersRegistry, UsersRegistry} from "./users/pds";
import {RecommandationEngine} from "./engine/engine";
import {createRecommandationServer} from "./express";

import https from "https";
import fs from "fs";
import {getRemoteClient} from "@datavillage-me/api";
import express from "express";
import {ErrorHandler} from "./express/utils";
import dotenv from 'dotenv';
import {RedisClientOptions} from "@redis/client";

dotenv.config();

const config = {
    DV_TOKEN: process.env.DV_TOKEN,
    DV_APP_ID: process.env.DV_APP_ID,
    DV_CLIENT_ID: process.env.DV_CLIENT_ID,
    DV_URL: process.env.DV_URL,
    REDIS_SERVICE_HOST: process.env.REDIS_SERVICE_HOST,
    REDIS_SERVICE_PORT: process.env.REDIS_SERVICE_PORT,
    TLS_CAFILE: process.env.TLS_CAFILE,
    REDIS_TLS: process.env.REDIS_TLS
}

const dvClient = config.DV_URL ? getRemoteClient(config.DV_URL, config.DV_TOKEN) : undefined;

export const TestRouter = () => {
    const router = express.Router();

    router.get('/', (req, res) => {
        res.json(config);
    });

    router.get('/users', (req, res) => {
        res.json(dvClient?.getClientsServices().getApplicationActiveUsers(config.DV_CLIENT_ID!, config.DV_APP_ID!));
    });

    return router;
}

async function createEngine(userRegistry: UsersRegistry) {


    const kg = new KnowledgeGraph(redis, 'metawal');
    await kg.init();

    const catalog = new DummyCatalogClient();
    const engine = new RecommandationEngine(userRegistry, kg, catalog);

    return engine;
}


export async function startRedis(engine: RecommandationEngine) {
    const queue = new RedisQueue();
    await queue.redis.connect();
}

export async function startExpress(userRegistry: UsersRegistry, engine: RecommandationEngine) {
    const useHttps = !!(process.env.TLS_CERTFILE && process.env.TLS_KEYFILE);

    const app = createRecommandationServer(userRegistry, engine);
    app.use("/test", TestRouter());
    app.use(express.static(__dirname + '/static'));
    app.use(ErrorHandler);

    const server = useHttps ?
        https.createServer({
            key: fs.readFileSync(process.env.TLS_KEYFILE!),
            cert: fs.readFileSync(process.env.TLS_CERTFILE!),
        }, app) :
        app;

    const PORT = process.env.PORT || (useHttps ? 5443 : 5000)

    server.listen(PORT, async () => {
        console.log(`Recommandation Server listening on ${useHttps?'HTTPS':'HTTP'}:${PORT}`);

        // Do post-start init
    });
}

const useRedisHttps = config.TLS_CAFILE || new Boolean(config.REDIS_TLS).valueOf();
console.log(`Connecting to Redis on ${useRedisHttps?'https':'http'}://${config.REDIS_SERVICE_HOST}:${config.REDIS_SERVICE_PORT} ...`)

// create Redis graph client

const socket: RedisClientOptions['socket'] = useRedisHttps ?
    {
        tls: true,
        ca: config.TLS_CAFILE ? fs.readFileSync(config.TLS_CAFILE) : undefined,
        host: config.REDIS_SERVICE_HOST || 'localhost',
        port: config.REDIS_SERVICE_PORT ? parseInt(config.REDIS_SERVICE_PORT) : undefined,
        checkServerIdentity: () => {
            return undefined;
        },
    } :
    {
        tls: false,
        host: config.REDIS_SERVICE_HOST || 'localhost',
        port: config.REDIS_SERVICE_PORT ? parseInt(config.REDIS_SERVICE_PORT) : undefined
    };

const redis: RedisClientType = createClient({socket});
redis.on('error', err => console.log('Redis Client Error', err));
redis.on('end', () => {
    console.log('Redis connection ended');
});

redis.connect()
    .catch(err => {
        throw new Error("Failed to connect to Redis Graph server: " + err)
    })
    .then(async () => {
        console.log('Connected to Redis');
        console.log(await redis.INFO());
        const usersReg = new RedisUsersRegistry(redis); // new DummyUsersRegistry();

        // Start the engine
        const engine = await createEngine(usersReg);
        console.log(`Recommandation engine ready`)

        await startExpress(usersReg, engine);
    });


