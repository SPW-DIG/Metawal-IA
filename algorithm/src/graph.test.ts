import * as rdflib from 'rdflib';
import * as fs from 'fs';
import { KnowledgeGraph } from "./graph";
import { createClient, Graph, RedisClientType } from "redis";

// example ttl from https://github.com/w3c/dxwg/tree/gh-pages/dcat/examples

jest.setTimeout(300000);


test('insert graph', async () => {

  const redis: RedisClientType = createClient();
  await redis.connect();

  const redisGraph = new Graph(redis, 'test');

  const res = await redisGraph.query(
    `MERGE (subj:TEST { uri: 'some uri' })
     SET subj += $obj`,
    {
      params: {
        obj: {'`http://test`': 3}
      }
    }
  );

  res;
})


test('Parse ttl', async () => {

  const ttlStr = fs.readFileSync('./src/samples/eea-csw.ttl')

  // parse RDF
  const store = rdflib.graph();
  rdflib.parse(ttlStr.toString(), store, 'http://test');

  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  await redis.graph.delete("metawal").catch(err => console.log);

  const kg = new KnowledgeGraph(redis, 'metawal');


  const res = await kg.loadGraph(store);
res

})



test('Parse dcat RDF', async () => {

  const ttlStr = fs.readFileSync('./src/samples/records-metawal.rdf')

  // parse RDF
  const store = rdflib.graph();
  rdflib.parse(ttlStr.toString(), store, 'http://test', 'application/rdf+xml');

  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  await redis.graph.delete("metawal").catch(err => console.log);

  const kg = new KnowledgeGraph(redis, 'metawal');


  const res = await kg.loadGraph(store);
  res

})



test('Query nodes by full text index', async () => {

  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  const nodes = await redis.graph.roQuery("metawal", "CALL db.idx.fulltext.queryNodes('dcat:Dataset', 'WMS districts') YIELD node").catch(err => console.log);

  nodes;
});


test('Query nodes by full text index on theme keywords', async () => {

  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  const nodes = await redis.graph.roQuery("metawal", "CALL db.idx.fulltext.queryNodes('skos:Concept', 'industrie') YIELD node").catch(err => console.log);

  nodes;
});
