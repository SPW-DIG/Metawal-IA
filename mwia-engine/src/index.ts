import {RedisQueue} from "./redis";
import {createClient, RedisClientType} from "redis";
import {KnowledgeGraph} from "./engine/graph";
import {DummyCatalogClient} from "./catalog/catalog";
import {DummyUsersRegistry} from "./users/pds";
import {RecommandationEngine} from "./engine/engine";
import {createRecommandationServer} from "./express";


async function createEngine() {
    // create Redis graph client
    const redis: RedisClientType = createClient();
    await redis.connect().catch(err => {throw new Error("Failed to connect to Redis Graph server: "+err)});

    const kg = new KnowledgeGraph(redis, 'metawal');
    await kg.init();

    const catalog = new DummyCatalogClient();
    const userReg = new DummyUsersRegistry();
    const engine = new RecommandationEngine(userReg, kg, catalog);

    return engine;
}



export async function startRedis(engine: RecommandationEngine) {
    const queue = new RedisQueue();
    await queue.redis.connect();
}

export async function startExpress(engine: RecommandationEngine) {
    const PORT = process.env.PORT || 5000;

    const server = createRecommandationServer(engine);

    server.listen(PORT, async () => {
        console.log(`Recommandation Server listening on :${PORT}`);

        // Do post-start init
    });
}

// Start the engine
createEngine().then(async (engine) => {
    console.log(`Recommandation engine ready`)

    await startExpress(engine);
});