import * as React from "react";
import {Button} from "@material-ui/core";
import {getBackendUrl} from "../../config";
import {usePromiseFn} from "../../utils/hooks";
import {PromiseStateContainer} from "../../utils/ui-utils";

async function syncCatalog() {
    const url = getBackendUrl("/admin/graph/sync");
    const resp = await fetch(url, {method: 'POST'});
    return resp.text();
}

export const AdminPanel = () => {

    const stats = usePromiseFn( async () => {
        const url = getBackendUrl("/admin/graph/stats");
        const resp = await fetch(url);
        return await resp.json() as {
            datasets: number,
            lastSync: number
        };
    }, []);

    return (
        <div>
            <h2>Recommandation Engine Admin Panel</h2>

            <PromiseStateContainer state={stats}>
                {(stats) =>
                    <div>
                        Datasets : {stats.datasets}<br/>
                        Last sync: {new Date(stats.lastSync).toString()}
                    </div>
                }
            </PromiseStateContainer>


            <Button onClick={syncCatalog}>Sync</Button>
        </div>
    );
}