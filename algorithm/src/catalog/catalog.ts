import fetch from "node-fetch";
import https from "https";

export class CatalogClient {
    private url: string;


    constructor(url: string) {
        this.url = url;
    }

    async getRecords<F extends string>(collection: string, start: number = 0, limit: number = 0, format: F = 'json' as F): Promise<F extends 'json' ? any : string>  {
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