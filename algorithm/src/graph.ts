import {Graph, RedisClientType} from "redis";
import {Literal, Statement, Store} from 'rdflib';
import ClassOrder from 'rdflib/lib/class-order';
import * as rdflib from "rdflib";

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

export class KnowledgeGraph {
    private graphName;
    private redisGraph;
    private namespacePrefixes;

    constructor(client: RedisClientType, graphName: string, namespacePrefixes: Record<string, string> = {}) {
        this.graphName = graphName;
        this.redisGraph = new Graph(client, this.graphName);
        this.namespacePrefixes = namespacePrefixes;
    }

    async loadGraph(store: Store) {
        const statementsBySubject = store.subjectIndex
        for (const subject in statementsBySubject) {
            const statements = statementsBySubject[subject] as unknown as rdflib.Statement[];

            if (statements.length) {
                const res = await this.addSubjectStatements(statements[0].subject.value, statements, store.namespaces);
                res;
            }
        }
    }

    async addSubjectStatements(subjectUri: string, statements: Statement[], namespacePrefixes: Record<string, string> = {}) {
        const literals = {};

        const typeSt = statements.find(s => s.predicate.value == 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        const type = typeSt?.object.value;
        const typeLabel = type && reduceWithWellKnownPrefix(type, {...this.namespacePrefixes, ...namespacePrefixes});
        // TODO use FOREACH : MATCH (subj) FOREACH(st in [{pred: pred1, obj: obj1}, {pred: pred2, obj: obj2}] | MERGE (subj)-[:REL { uri: st.pred }]->({ uri: st.obj }) )

        let query = `MERGE (subj { uri: $subjectUri })
    SET subj:\`${typeLabel || ''}\``;
        const params: Record<string, any> = {
            subjectUri
        };

        statements.forEach(s => {
            if (
                (s.object.classOrder == ClassOrder.NamedNode || s.object.classOrder == ClassOrder.BlankNode) &&
                INLINE_OBJ_PROPS.indexOf(s.predicate.value) < 0
            ) {
                const predicateLabel = reduceWithWellKnownPrefix(s.predicate.value, {...this.namespacePrefixes, ...namespacePrefixes})
                query += `
      MERGE (subj)-[:\`${predicateLabel || ''}\` {uri: '${s.predicate.value}'}]->({ uri: '${s.object.value}' })`;
            } else {
                let value = getNodeValue(s.object);
                const prop = `\`${s.predicate.value}\``;

                if (SINGLE_VALUE_PROPS.indexOf(s.predicate.value) < 0) {
                    // this predicate can be an array of values
                    if (typeof value == 'string') value = `'${value.replaceAll("'", "\\'")}'`;
                    if (value != undefined) {
                        query += `\nSET subj.${prop} = coalesce(subj.${prop}, []) + ${value} `;
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
            query += `\nSET subj += $literals`
        }

        return this.redisGraph.query(query, {params});
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
