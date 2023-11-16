import * as React from "react";
import {Button} from "@mui/material";
import {useBackend} from "../../utils/engine";
import {PromiseStateContainer, usePromiseFn} from "@datavillage-me/dv-common-ui";
import {useState} from "react";

export const AdminPanel = () => {

    const backend = useBackend();

    const stats = usePromiseFn( async () => backend.getStats(), [backend]);

    const [syncResult, setSyncResult] = useState<Awaited<ReturnType<typeof backend.syncCatalog>>>();

    return (
        <div>
            <h2>Recommandation Engine Admin Panel</h2>

            <PromiseStateContainer promiseState={stats}>
                {(stats) =>
                    <div>
                        Datasets : {stats.datasets}<br/>
                        Last sync: {new Date(stats.lastSync).toString()}
                    </div>
                }
            </PromiseStateContainer>


            <Button onClick={() => backend.reset()}>Reset</Button>
            <Button onClick={() => backend.syncCatalog().then(setSyncResult)}>Sync</Button>
            {syncResult ?
            <div>
                {syncResult.added} records added in {syncResult.time} ms
            </div> : null}
        </div>
    );
}