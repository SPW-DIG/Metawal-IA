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

    async getRecommandations(userId?: string, searchTerms?: string[]): Promise<DatasetRecommendation[]> {
        if (userId) {
            const userProfile = this.userReg.getUserProfile(userId);

            if (userProfile) {

            } else {
                throw new Error("User does not exist");
            }
            // TODO load profile into graph
            return [];
        } else {
            return this.graph.searchDatasets({terms: searchTerms, userProfile: undefined})
        }
    }

}