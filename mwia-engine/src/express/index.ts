import express, {Application} from 'express';
import {RecommandationRouter} from "./recoRouter";
import {RecommandationEngine} from "../engine/engine";
import {AdminRouter} from "./adminRouter";
import {ErrorHandler} from "./utils";
import {UsersRegistry} from "../users/pds";
import {UserRouter} from "./userRouter";


export function getRecoEngine(app: Application) {
    return app.get("recoEngine") as RecommandationEngine;
}

export function getUsersRegistry(app: Application) {
    return app.get("usersReg") as UsersRegistry;
}

export function createRecommandationServer(userRegistry: UsersRegistry, engine: RecommandationEngine) {
    const app = express();

    app.set("recoEngine", engine);
    app.set("usersReg", userRegistry);

    app.use(express.urlencoded({extended: true}));
    app.use(express.text({type: "*/*"}));

//app.use(express.static(__dirname + '/static'));

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        next();
    });

    app.use("/recommandations", RecommandationRouter());
    app.use("/admin", AdminRouter());
    app.use("/user", UserRouter());

    app.use(ErrorHandler);

    return app;
}

