import express, {Request} from "express";
import {getUsersRegistry} from "./index";
import {PersonalProfile} from "@spw-dig/mwia-core";

export const UserRouter = () => {
    const router = express.Router();


    /**
     * Return the full EPC document by URI
     */
    router.post('/register', async (req: Request<void, void, void, {userUri: string, podUri: string}>, res) => {
        const registry = getUsersRegistry(req.app);

        registry.registerUser({uri: req.query.userUri, podUri: req.query.podUri});

        res.json();
    });


    /**
     * Return the full EPC document by URI
     */
    router.get('/', async (req: Request<void, PersonalProfile, void, {userUri: string}>, res) => {
        const registry = getUsersRegistry(req.app);

        const profile = await registry.getUser(req.query.userUri);

        if (profile)
            res.json(profile);
        else
            res.sendStatus(404);
    });


    /**
     * Return the full EPC document by URI
     */
    router.get('/profile', async (req: Request<void, PersonalProfile, void, void>, res) => {
        const registry = getUsersRegistry(req.app);

        //  TODO get userId from request (auth headers ?)
        const userId = "https://geoportail.wallonie.be/users/user002";

        const profile = await registry.getUserProfile(userId);

        res.json(profile);
    });

    /**
     * Return the full EPC document by URI
     */
    router.put('/profile', async (req: Request<void, void, PersonalProfile, void>, res) => {
        //const engine = getUsersRegistry(req.app);

        // TODO check userProfile validity and against auth user

        // TODO
        //await engine.getUserStorage().saveUserProfile(req.body);

        res.json();
    });

    return router;
};