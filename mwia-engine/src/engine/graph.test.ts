import * as rdflib from 'rdflib';
import * as fs from 'fs';
import { KnowledgeGraph } from "./graph";
import { createClient, Graph, RedisClientType } from "redis";
import {XMLBuilder, XMLParser} from "fast-xml-parser";
import {DummyUsersRegistry} from "../users/pds";
import {assert} from "@spw-dig/mwia-core";

// example ttl from https://github.com/w3c/dxwg/tree/gh-pages/dcat/examples

jest.setTimeout(3000000);


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


function removeMiddleSpace(obj: any, prop: string, chars: string = ' ') {
  if (obj[prop]) {
    const splitIdx = obj[prop].indexOf(chars);
    obj[prop] = obj[prop].substring(0, splitIdx);
  }
}


function fixAgentMbox(agent: any) {
  const agentMbox = agent && agent['foaf:mbox'] && agent['foaf:mbox'];
  removeMiddleSpace(agentMbox, '@rdf:resource');
}

test('Fix CSW XML', async () => {

  let xmlStr = fs.readFileSync('./src/samples/metawal_csw_dcat_prod.rdf').toString();

  // fix wrong URL for datasets
  xmlStr = xmlStr.replaceAll('/srv/resources/datasets/', '/srv/resources/');

  const parser = new XMLParser({ignoreAttributes: false, attributeNamePrefix: "@", textNodeName: "value"});

  const obj = parser.parse(xmlStr);

  obj['csw:GetRecordsResponse']['rdf:RDF'].forEach( (record: any) => {
    const obj = record['dcat:Dataset'] || record['rdf:Description'];

    if (obj && obj['dct:identifier'].indexOf(' ') >= 0) {
      removeMiddleSpace(obj,'dct:identifier');

      removeMiddleSpace(obj,'@rdf:about');

      removeMiddleSpace(record['dcat:CatalogRecord']['foaf:primaryTopic'],'@rdf:resource', '%20');

      const licenses = Array.isArray(obj['dct:license']) ? obj['dct:license'] : obj['dct:license'] ? [obj['dct:license']] : [];
      licenses.forEach(license => removeMiddleSpace(license,'@rdf:resource'));
    }

    if (record['foaf:Agent']) {
      if (Array.isArray(record['foaf:Agent'])) {
        record['foaf:Agent'].forEach(fixAgentMbox);
      } else {
        fixAgentMbox(record['foaf:Agent']);
      }
    }

  });

  const builder = new XMLBuilder({
    ignoreAttributes : false,
    attributeNamePrefix: "@",
    textNodeName: "value",
    format: true
  });
  const xmlContent = builder.build(obj);

  fs.writeFileSync('./src/samples/metawal_csw_dcat_prod_fixed.rdf', xmlContent);
})





test('Parse small dcat RDF', async () => {

  const ttlStr = fs.readFileSync('./src/samples/metawal_csw_dcat_prod_fixed_subset.rdf')

  // parse RDF
  const store = rdflib.graph();
  rdflib.parse(ttlStr.toString(), store, 'http://test', 'application/rdf+xml');

  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  const kg = new KnowledgeGraph(redis, 'metawal_small');
  await kg.reset();
  await kg.init();

  const res = await kg.loadGraph(store);
  return res;

})



test('Parse dcat RDF', async () => {

  const ttlStr = fs.readFileSync('./src/samples/metawal_csw_dcat_prod_fixed.rdf')

  // parse RDF
  const store = rdflib.graph();
  rdflib.parse(ttlStr.toString(), store, 'http://test', 'application/rdf+xml');

  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  await redis.graph.delete("metawal").catch(err => console.log);

  const kg = new KnowledgeGraph(redis, 'metawal');
  await kg.init();

  const res = await kg.loadGraph(store);
  return res;

})



test('Query nodes by full text index', async () => {

  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  const nodes = await redis.graph.roQuery("metawal", "CALL db.idx.fulltext.queryNodes('dcat:Resource', 'WMS districts') YIELD node").catch(err => console.log);

  nodes;
});


test('Query nodes by full text index on theme keywords', async () => {

  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  const nodes = await redis.graph.roQuery("metawal", "CALL db.idx.fulltext.queryNodes('skos:Concept', 'industrie') YIELD node").catch(err => console.log);

  nodes;
});



test('Insert and delete user profile', async () => {

  const userReg = new DummyUsersRegistry();

  // create Redis graph client
  const redis: RedisClientType = createClient();
  await redis.connect();

  const kg = new KnowledgeGraph(redis, 'metawal');

  const profile = userReg.getUserProfile("https://geoportail.wallonie.be/users/user002");

  assert(profile);

  await kg.loadUserProfile(profile);

  await kg.deleteUserProfile(profile.uri);

});

