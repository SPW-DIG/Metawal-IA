import fetch from "node-fetch";
import https from "https";
import fs from "fs";

export interface CatalogClient {
    getRecords<F extends string>(collection: string, start?: number, limit?: number, format?: F): Promise<F extends 'json' ? any : string>;
}

export class CswCatalogClient implements CatalogClient {
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    async getRecords<F extends string>(collection: string, start: number = 0, limit: number = 0, format: F = 'dcat' as F): Promise<F extends 'json' ? any : string>  {
        const response = await fetch(new URL(`collections/${collection}/items?startIndex=${start}&limit=${limit}&f=${format}`, this.url).toString(), {
            agent: new https.Agent({
                rejectUnauthorized: false,
            })
        })

        if (format == 'json')
            return response.json() as Promise<any>;
        else
            return response.text();
    }
}

export class DummyCatalogClient implements CatalogClient {

    constructor() {
    }

    async getRecords<F extends string>(collection: string, start: number = 0, limit: number = 0, format: F = 'dcat' as F): Promise<F extends 'json' ? any : string>  {
        if (format == 'dcat') {
            //const ttlStr = fs.readFileSync('./src/samples/records-metawal.rdf');
            const ttlStr = fs.readFileSync('./src/samples/metawal_csw_dcat.rdf');
            return Promise.resolve(ttlStr.toString());
        } else
            throw new Error("Not supported");
    }
}