import express, {Request} from "express";
import {getRecoEngine} from "./index";

export const AdminRouter = () => {
    const router = express.Router();


    /**
     * Return the full EPC document by URI
     */
    router.get('/graph/stats', async (req: Request<void, any, void, void>, res) => {
        const engine = getRecoEngine(req.app);

        // TODO
        res.json(await engine.stats());
    });

    /**
     * Return the full EPC document by URI
     */
    router.post('/graph/sync', async (req: Request<void, any, void, void>, res) => {
        const engine = getRecoEngine(req.app);

        // TODO
        const count = await engine.syncCatalog();

        res.json({added: count})
    });

    return router;
};