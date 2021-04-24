import { bootstrap } from "../Bootstrap";
bootstrap();

import { StateService } from "../../src/state/StateService";
import { State } from "../../src/state/State";

describe("StateService.ctor", () => {
    it("should be contructed", () => {
        let stateService: StateService = new StateService(State.Traversing);

        expect(stateService).toBeDefined();
    });
});
