import * as React from "react";
import {Button} from "@mui/material";
import {usePromiseFn} from "../../utils/hooks";
import {PromiseStateContainer} from "../../utils/ui-utils";
import {useBackend} from "../../utils/engine";

export const AdminPanel = () => {

    const backend = useBackend();

    const stats = usePromiseFn( async () => backend.getStats(), [backend]);

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


            <Button onClick={backend.syncCatalog}>Sync</Button>
        </div>
    );
}