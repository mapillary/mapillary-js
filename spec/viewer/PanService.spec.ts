import {
    APIv3,
} from "../../src/API";
import {
    Graph,
    GraphService,
    ImageLoadingService,
} from "../../src/Graph";
import {
    StateService,
} from "../../src/State";

import { PanService } from "../../src/viewer/PanService";

describe("PanService.ctor", () => {
    it("should be defined when constructed", () => {
        const clientId: string = "clientId";
        const apiV3: APIv3 = new APIv3(clientId);
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();
        const graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        const stateService: StateService = new StateService();

        const panService: PanService = new PanService(graphService, stateService);

        expect(panService).toBeDefined();
    });
});
