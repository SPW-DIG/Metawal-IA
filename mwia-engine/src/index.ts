import {RedisQueue} from "./redis";
import {createClient, RedisClientType} from "redis";
import {KnowledgeGraph} from "./engine/graph";
import {DummyCatalogClient} from "./catalog/catalog";
import {RedisUsersRegistry, UsersRegistry} from "./users/pds";
import {RecommandationEngine} from "./engine/engine";
import {createRecommandationServer} from "./express";


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
    const PORT = process.env.PORT || 5000;

    const server = createRecommandationServer(userRegistry, engine);

    server.listen(PORT, async () => {
        console.log(`Recommandation Server listening on :${PORT}`);

        // Do post-start init
    });
}


// create Redis graph client
const redis: RedisClientType = createClient();
redis.connect().catch(err => {throw new Error("Failed to connect to Redis Graph server: "+err)}).then( async () => {
    const usersReg = new RedisUsersRegistry(redis); // new DummyUsersRegistry();

    // Start the engine
    const engine = await createEngine(usersReg);
    console.log(`Recommandation engine ready`)

    await startExpress(usersReg, engine);
});


