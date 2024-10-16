import { bootstrap } from "../Bootstrap";
bootstrap();

import { StateService } from "../../src/state/StateService";
import { State } from "../../src/state/State";
import { S2GeometryProvider } from "../../src/api/S2GeometryProvider";

describe("StateService.ctor", () => {
    it("should be contructed", () => {
        let stateService: StateService = new StateService(State.Traversing, new S2GeometryProvider());

        expect(stateService).toBeDefined();
    });
});
