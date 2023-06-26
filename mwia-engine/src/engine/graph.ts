import {Graph, RedisClientType} from "redis";
import {Literal, Namespace, Statement, Store} from 'rdflib';
import ClassOrder from 'rdflib/lib/class-order';
import * as rdflib from "rdflib";
import {DatasetRecommendation, PersonalProfile} from "@spw-dig/mwia-core";
import {fulltextSearch, fulltextSearchAndUser} from "./cypherQueries";

var FOAF = Namespace("http://xmlns.com/foaf/0.1/");

export enum WELLKNOWN_TYPES {
    Dataset = 'http://www.w3.org/ns/dcat#Dataset'
}

export const NUMBER_TYPES = [
    'http://www.w3.org/2001/XMLSchema#decimal',
    'http://www.w3.org/2001/XMLSchema#integer',
    'http://www.w3.org/2001/XMLSchema#float',
    'http://www.w3.org/2001/XMLSchema#double'
];

export const SINGLE_VALUE_PROPS: string[] = [];

export const INLINE_OBJ_PROPS = [
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    'http://purl.org/dc/terms/language',
    'http://www.w3.org/ns/dcat#mediaType',
    'http://www.w3.org/ns/dcat#downloadURL',
    'http://purl.org/dc/terms/accessRights',
    'http://purl.org/dc/terms/type',
    'http://purl.org/dc/terms/conformsTo',
    'http://www.w3.org/2006/vcard/ns#hasEmail',
    'http://www.w3.org/2006/vcard/ns#hasURL'
];

export type DatasetGraphNode = { id: number, labels: string[], properties: {uri: string /* , ... */} & any};

export type SearchResultNode = { id: string, uri: string, title: string, score: number};

export const DATE_TYPES = ['http://www.w3.org/2001/XMLSchema#date'];

export function reduceWithWellKnownPrefix(uri: string, namespaces: Record<string, string>) {
    const matchingEntry = Object.entries(namespaces).find(([prefix, value]) => uri.startsWith(value));

    if (!matchingEntry) return undefined;

    return matchingEntry[0] + ':' + uri.substring(matchingEntry[1].length);
}

export function getNodeValue(obj: Statement['object']) {
    switch (obj.classOrder) {
        case ClassOrder.Literal:
            return NUMBER_TYPES.indexOf((obj as Literal).datatype.value) >= 0
                ? Number.parseFloat(obj.value)
                : DATE_TYPES.indexOf((obj as Literal).datatype.value) >= 0
                    ? new Date(obj.value).toISOString()
                    : obj.value;
        case ClassOrder.NamedNode:
        case ClassOrder.BlankNode:
        default:
            return obj.value;
    }
}

export function deaccent(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export type SearchQuery = {
    userId?: string;
    terms?: string[];
    limit?: number;
    // TODO temporal
}

export class KnowledgeGraph {
    private graphName;
    private redisClient: RedisClientType;
    private redisGraph: Graph;
    private namespacePrefixes;

    constructor(client: RedisClientType, graphName: string, namespacePrefixes: Record<string, string> = {}) {
        this.graphName = graphName;
        this.redisClient = client;
        this.redisGraph = new Graph(this.redisClient, this.graphName);
        this.namespacePrefixes = namespacePrefixes;
    }

    async init() {
        // init full text index
        // WARN this call is async - it can't be waited on as part of a constructor
        await this.redisGraph.query("CALL db.idx.fulltext.createNodeIndex('dcat:Resource', 'FTkeywords')");
        await this.redisGraph.query("CALL db.idx.fulltext.createNodeIndex('skos:Concept', 'FTlabel')");
    }

    async reset() {
        return this.redisClient.graph.delete(this.graphName).catch(err => {
            if (err.toString().indexOf('Invalid graph operation on empty key') >= 0) {
                // ignore
            } else {
                throw err;
            }
        });
    }

    async loadGraph(store: Store) {
        let count = 0;

        // the map of CatalogObjects (Dataset, Service, ...) to their CatalogRecords
        const object2recordMap = store.statementsMatching(undefined, FOAF('primaryTopic'), undefined).reduce<Record<string, string>>((prev, current) => { prev[current.object.value] = current.subject.value; return prev }, {});

        const statementsBySubject = store.subjectIndex
        for (const subject in statementsBySubject) {
            const statements = statementsBySubject[subject] as unknown as rdflib.Statement[];

            if (statements.length) {
                const res = await this.addSubjectStatements(statements[0].subject.value, statements, store.namespaces, object2recordMap);
                count++;
                res;
            }
        }

        return count;
    }

    async addSubjectStatements(subjectUri: string, statements: Statement[], namespacePrefixes: Record<string, string> = {}, object2recordMap: Record<string, string>) {
        const literals = {};

        const typeSt = statements.find(s => s.predicate.value == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        const type = typeSt?.object.value;

        let typeLabels = type ? [reduceWithWellKnownPrefix(type, {...this.namespacePrefixes, ...namespacePrefixes})] : [];

        // If this is a first-order catalog object, add the generic dcat:Resource type
        if (object2recordMap[subjectUri]) {
            typeLabels.push(reduceWithWellKnownPrefix('http://www.w3.org/ns/dcat#Resource', {...this.namespacePrefixes, ...namespacePrefixes}));
        } else if (!typeLabels.length) {
            // default label
            typeLabels.push('Prop');
        }

        // TODO use FOREACH : MATCH (subj) FOREACH(st in [{pred: pred1, obj: obj1}, {pred: pred2, obj: obj2}] | MERGE (subj)-[:REL { uri: st.pred }]->({ uri: st.obj }) )

        let matches: string[] = [];
        let merges: string[] = [`MERGE (subj { uri: $subjectUri })`];
        let sets = [`SET subj${typeLabels.map(l => `:\`${l}\``).join('')}`];

        const params: Record<string, any> = {
            subjectUri
        };

        statements.forEach((s,index) => {
            if (
                (s.object.classOrder == ClassOrder.NamedNode || s.object.classOrder == ClassOrder.BlankNode) &&
                INLINE_OBJ_PROPS.indexOf(s.predicate.value) < 0
            ) {
                const predicateLabel = reduceWithWellKnownPrefix(s.predicate.value, {...this.namespacePrefixes, ...namespacePrefixes})
                merges.push(`MERGE (obj_${index} { uri: '${s.object.value}' })`);
                merges.push(`MERGE (subj)-[:\`${predicateLabel || ''}\` {uri: '${s.predicate.value}'}]->(obj_${index})`)
            } else {
                let value = getNodeValue(s.object);
                const prop = `\`${s.predicate.value}\``;

                if (SINGLE_VALUE_PROPS.indexOf(s.predicate.value) < 0) {
                    // this predicate can be an array of values
                    if (typeof value == 'string') value = `'${value.replaceAll("'", "\\'")}'`;
                    if (value != undefined) {
                        sets.push(`\nSET subj.${prop} = coalesce(subj.${prop}, []) + ${value} `);
                        if (s.predicate.value == 'http://www.w3.org/ns/dcat#keyword') {
                            // Create an aggregated text field for fulltext indexing purposes
                            sets.push(`\nSET subj.FTkeywords = coalesce(subj.FTkeywords, '') + ' ' + ${deaccent(value+'')} `);
                        }
                        if (s.predicate.value == 'http://www.w3.org/2004/02/skos/core#prefLabel') {
                            // Create an aggregated text field for fulltext indexing purposes
                            sets.push(`\nSET subj.FTlabel = coalesce(subj.FTlabel, '') + ' ' + ${deaccent(value+'')} `);
                        }
                    }
                } else {
                    if (literals[prop]) {
                        console.warn('Settings a single-valued prop multiple times: ' + prop);
                    }
                    literals[prop] = value;
                }
            }
        });

        if (Object.keys(literals).length > 0) {
            params.literals = literals;
            sets.push(`\nSET subj += $literals`);
        }

        const query = matches.join('\n') + '\n' + merges.join('\n') + '\n' + sets.join('\n');

        return this.redisGraph.query(query, {params});
    }


    /* Cypher queries :

    CALL db.idx.fulltext.queryNodes('Movie', 'Book') YIELD node RETURN node.title

    CALL db.idx.fulltext.queryNodes('skos:Concept', 'eau') YIELD node as tag MATCH (node)-[p]->(tag) RETURN node,p,tag LIMIT 50"
    */

    async loadUserProfile(profile: PersonalProfile) {
        let mergeQuery = `
        MERGE (user:User {uri:'${profile.uri}'})
        `;

        const browseMerges = profile.browseHistory.map(item =>  `
        MATCH (res:\`dcat:Resource\` {uri:'${item.datasetUri}'})
        MERGE (user)-[:hasBrowsed]->(res)`
        ).join('\n')

       if (browseMerges) mergeQuery += 'WITH user \n' + browseMerges;

        return this.redisGraph.query(mergeQuery).catch(err => {
            console.warn(`Cypher query failed : ${err} \n>>> ${mergeQuery}`);
            throw err;
        });
    }

    async checkUserProfile(userUri: string) {
        let query = `
        MATCH (user:User {uri:'${userUri}'})
        RETURN user
        `;

        return this.redisGraph.query<{user: {properties: {uri: string}}}>(query).then(reply => !!reply.data?.length);
    }

    async deleteUserProfile(userUri: string) {
        let deleteQuery = `
        MATCH (user:User {uri:'${userUri}'})
        DELETE user
        `;

        return this.redisGraph.query(deleteQuery);
    }

    async searchDatasets(query: SearchQuery): Promise<DatasetRecommendation[]> {
        let cypher_query;
        if (query.terms && query.userId) {
            cypher_query = fulltextSearchAndUser(deaccent(query.terms.join(' ')), query.userId, undefined, query.limit);
        } else if (query.terms) {
            cypher_query = fulltextSearch(deaccent(query.terms.join(' ')), undefined, query.limit);
        } else if (query.userId) {
            return [];
        } else {
            // spontaneous suggestions
            return [];
        }

        console.log(`CYPHER QUERY: ${cypher_query}`);

        const reply = await this.redisGraph.query<SearchResultNode>(cypher_query);

        return reply.data ? reply.data.map((node) => ({
            datasetUri: node.uri,
            id: node.id,
            score: node.score,
            timestamp: new Date().getTime(),
            title: node.title,
            //id: node.properties['http://purl.org/dc/terms/identifier'][0],
        })) : []

    }

    async stats() {
        const reply = await this.redisGraph.query<{count: number}>("MATCH (o:`dcat:Dataset`) RETURN count(o) as count");

        return {
            datasets: reply.data ? reply.data[0].count : 0,
            lastSync: 0
        }
    }

    async cleanUp() {

        // remove all erroneous relations to 'https://metawal.wallonie.be/geonetwork/records/'
        return this.redisGraph.query(`
        MATCH (o {uri:'https://metawal.wallonie.be/geonetwork/records/'})
        DELETE o
        `);

        // replace 'dct:relation' that transit via dcat:CatalogRecord with direct 'dct:dsrelation'
        return this.redisGraph.query(`
        MATCH (res1:\`dcat:Resource\`)-[:\`dct:relation\`]-(rec:\`dcat:CatalogRecord\`)-[:\`dct:relation\`]-(res2:\`dcat:Resource\`)
        WHERE res1 <> res2
        MERGE (res1)-[:\`dct:dsrelation\`]-(res2)
        `);

    }

    /*
    async findShortestPaths(startUri: string) {
        const query =
          `MATCH (a{uri:'${startUri}'}),(g:{uri:'A'})
           CALL algo.SPpaths( {sourceNode: a, targetNode: g, relTypes: ['Road'], pathCount: 5, weightProp: 'dist'} )
           YIELD path, pathWeight
           RETURN pathWeight, [n in nodes(path) | n.name]
           ORDER BY pathWeight`
    }

     */
}
