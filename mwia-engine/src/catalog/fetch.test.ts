import {CswCatalogClient} from "./catalog";

const METAWAL_API = 'https://sextant.ifremer.fr/geonetwork/api/' // 'https://metawal4.test.wallonie.be/geonetwork/api/';

test('Fetch records', async () => {
    const client = new CswCatalogClient(METAWAL_API);

    const records = await client.getRecords('main', 0, 10, 'dcat');

    records;

})