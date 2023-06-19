import {UsersRegistry} from "../users/pds";
import {KnowledgeGraph} from "./graph";
import {CatalogClient} from "../catalog/catalog";
import * as rdflib from "rdflib";


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

        return this.graph.loadGraph(store);
    }

    getRecommandations(userId?: string, searchTerms?: string[]) {
        if (userId) {
            const userProfile = this.userReg.getUserProfile(userId);

            if (userProfile) {

            } else {
                throw new Error("User does not exist");
            }
            // TODO load profile into graph
        } else {

        }
    }

}