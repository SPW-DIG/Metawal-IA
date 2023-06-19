import {RecommandationEngine} from "./engine";
import {createClient, RedisClientType} from "redis";
import {KnowledgeGraph} from "./graph";
import {DummyUsersRegistry} from "../users/pds";
import {DummyCatalogClient} from "../catalog/catalog";

jest.setTimeout(300000);


async function createEngine() {
  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  const kg = new KnowledgeGraph(redis, 'metawal');
  const catalog = new DummyCatalogClient();
  const userReg = new DummyUsersRegistry();
  const engine = new RecommandationEngine(userReg, kg, catalog);

  return engine;
}

test('Start engine', async () => {

  const engine = await createEngine();

  await engine.init();

  await engine.reset();

  // do a first sync
  let updatedRecords = await engine.syncCatalog();

  updatedRecords;

  // sync again
  updatedRecords = await engine.syncCatalog();
})

