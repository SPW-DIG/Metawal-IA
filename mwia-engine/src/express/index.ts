import express, {Application} from 'express';
import {RecommandationRouter} from "./recoRouter";
import {RecommandationEngine} from "../engine/engine";
import {AdminRouter} from "./adminRouter";


export function getRecoEngine(app: Application) {
    return app.get("recoEngine") as RecommandationEngine;
}

export function createRecommandationServer(engine: RecommandationEngine) {
    const app = express();

    app.set("recoEngine", engine);

    app.use(express.urlencoded({extended: true}));
    app.use(express.text({type: "*/*"}));

//app.use(express.static(__dirname + '/static'));

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        next();
    });

    app.use("/recommandations", RecommandationRouter());
    app.use("/admin", AdminRouter());

    return app;
}

