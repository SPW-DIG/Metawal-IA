import {UsersRegistry} from "../users/pds";
import {KnowledgeGraph} from "./graph";
import {CatalogClient} from "../catalog/catalog";
import * as rdflib from "rdflib";
import {DatasetRecommendation} from "@spw-dig/mwia-core";


export class RecommandationEngine {

    private userReg: UsersRegistry;
    private graph: KnowledgeGraph;
    private catalog: CatalogClient;


    constructor(userReg: UsersRegistry, graph: KnowledgeGraph, catalog: CatalogClient) {
        this.userReg = userReg;
        this.graph = graph;
        this.catalog = catalog;
    }

    async init() {
        return this.graph.init();
    }

    async reset() {
        return this.graph.reset();
    }

    async syncCatalog() {

        const dcatStr = await this.catalog.getRecords("TODO");

        const store = rdflib.graph();
        rdflib.parse(dcatStr, store, 'http://test', 'application/rdf+xml');

        const count = await this.graph.loadGraph(store);

        console.log(`Catalog sync : added ${count} records`);

        return count;
    }


    async stats() {

        return this.graph.stats();
    }

    async getRecommandations(userId?: string, searchTerms?: string[], reloadProfile?: boolean): Promise<DatasetRecommendation[]> {
        if (userId) {
            let mark = new Date().getTime();

            const userProfile = await this.userReg.getUserAppStorage(userId).then(store => store.getUserProfile());

            console.log(`[PERF] Profile Fetch : ${new Date().getTime()-mark}`);

            if (userProfile) {
                // TODO check if profile already loaded
                const isProfileLoaded = await this.graph.checkUserProfile(userId);
                if (!isProfileLoaded || reloadProfile) {
                    mark = new Date().getTime();
                    await this.graph.loadUserProfile(userProfile);
                    console.log(`[PERF] Profile load : ${new Date().getTime()-mark}`);
                }
            } else {
                throw new Error("User does not exist");
            }

            mark = new Date().getTime();
            const results = await this.graph.searchDatasets({terms: searchTerms, userId});
            console.log(`[PERF] Reco Search : ${new Date().getTime()-mark}`);
            return results;
        } else {
            return this.graph.searchDatasets({terms: searchTerms})
        }
    }

}