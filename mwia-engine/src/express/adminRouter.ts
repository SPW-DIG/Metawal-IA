import {Request} from "express";
import {getRecoEngine} from "./index";
import createRouter from 'express-promise-router';

export const AdminRouter = () => {
    const router = createRouter();


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

        const time = new Date().getTime();
        // TODO
        const count = await engine.syncCatalog();

        res.json({added: count, time: new Date().getTime() - time})
    });

    router.post('/graph/reset', async (req: Request<void, any, void, void>, res) => {
        const engine = getRecoEngine(req.app);

        const result = await engine.reset();

        res.send(result);
    });

    return router;
};