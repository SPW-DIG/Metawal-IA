import express, {Request} from "express";
import {getRecoEngine} from "./index";
import {DatasetRecommendation} from "@spw-dig/mwia-core";

export const RecommandationRouter = () => {
    const router = express.Router();

    /**
     * Return the full EPC document by URI
     */
    router.get('/', async (req: Request<void, DatasetRecommendation[], void, { search: string, userId?: string }>, res) => {
        const engine = getRecoEngine(req.app);

        // TODO
        const recos = await engine.getRecommandations(req.query.userId, req.query.search.split(' '));

        res.json(recos);
    });

    return router;
};