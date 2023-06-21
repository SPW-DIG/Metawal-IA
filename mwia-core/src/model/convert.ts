import {graph, IndexedFormula, parse, serialize} from "rdflib";
import * as jsonld from 'jsonld';
import {Frame} from 'jsonld/jsonld-spec';

const DEFAULT_URI = "http://datavillage.me/"

export enum CONTENT_TYPES {
    text = 'text/plain',
    turtle = 'text/turtle',
    rdf_xml = 'application/rdf+xml',
    json = 'application/json',
    jsonld = "application/ld+json",
    nq = 'application/n-quads',
    n3 = 'text/n3',
    nt = 'application/n-triples'
}

/*
export const epcSummaryFrame: Frame = {
    '@context': {
        "@base": "http://service.geefepcdienst-02_01.energie-02_01.vip.vlaanderen.be/epc/",
        "energie": "http://energie-02_01.epb.vea.lne.vlaanderen.be/",
        "generiek": "http://generiek-02_00.vip.vlaanderen.be/",
        id: '@id',
    },
    '@explicit': true,
    '@requireAll': true,
    type: 'en:Epc',
    "id": {},
    "energie:Identificatie": {},
    "energie:Details": {'@explicit': true, "energie:Bouwvorm": {}},
    "energie:Scores": {
        '@explicit': true,
        "energie:ScoreKleur": {
            '@explicit': true,
            "energie:Code": {}
        },
        "energie:Score": {
            '@explicit': true,
            '@requireAll': true,
            'energie:type': 'primaireEnergieVerbruikPerVierkanteMeter',
            "energie:Waarde": {}
        }
    },
    "energie:Ligging": {
        '@explicit': true,
        "energie:Adres": {
            '@explicit': true,
            "generiek:Gemeente": {}
        }
    }
};

 */


export async function jsonld2ttl(xmlData: string) {
    const store = graph();
    await new Promise<void>((resolve, reject) => {
        parse(xmlData, store, DEFAULT_URI, CONTENT_TYPES.jsonld, (error => {
            if (error) reject(error);
            else resolve();
        }));
    })

    const ttl = await serialize(null as any, store, DEFAULT_URI, CONTENT_TYPES.turtle /* CONTENT_TYPES.n3 */, undefined, {flags: 'n'});

    return ttl;
}


export async function frameRdfStrings<T extends jsonld.NodeObject = any>(rdfStrings: (string | undefined)[], frame: Frame): Promise<T[]> {
    const fullString = rdfStrings.filter(str => !!str).join('\n');

    if (fullString) {
        // jsonld only accepts nquads/ntriples - first parse with rdflib to ensure ntriples format
        const store = graph();
        parse(fullString, store, DEFAULT_URI, CONTENT_TYPES.turtle);

        return frameRdfGraph(store, frame);
    } else {
        return [];
    }
}

export async function frameRdfGraph<T extends jsonld.NodeObject = any>(graph: IndexedFormula, frame: Frame): Promise<T[]> {
    const nquads = await serialize(null as any, graph, DEFAULT_URI, CONTENT_TYPES.nt, undefined, {flags: 'n'});

    const jsonldRecos = await jsonld.fromRDF(nquads as any, {
        format: CONTENT_TYPES.nq,
        useNativeTypes: true
    });
    const framedJson = await jsonld.frame(
        jsonldRecos,
        frame,

        // @ts-ignore : omitGraph is not yet in @types/jsonld
        {omitGraph: false}
    );

    return (framedJson['@graph'] || []) as T[];
}

export async function reverseFrame(object: any, frame: Frame): Promise<string> {
    if (typeof frame == 'string') throw new Error('Frame by URL not supported');

    const ctx = Array.isArray(frame['@context']) ? frame['@context'][0] : frame['@context'];
    if (typeof ctx == 'string') throw new Error('Context by URL not supported');

    //const rdf = await jsonld.flatten({"@graph": object
    //}, ctx || undefined)

    //@ts-ignore
    return jsonld.normalize({'@context': frame['@context'], '@graph': object}, {safe: false});
}
