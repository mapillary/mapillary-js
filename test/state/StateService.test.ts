import { bootstrap } from "../Bootstrap";
bootstrap();

import { StateService } from "../../src/state/StateService";

describe("StateService.ctor", () => {
    it("should be contructed", () => {
        let stateService: StateService = new StateService();

        expect(stateService).toBeDefined();
    });
});
