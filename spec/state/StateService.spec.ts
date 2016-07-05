/// <reference path="../../typings/index.d.ts" />

import * as rx from "rx";

import {StateService} from "../../src/State";

describe("StateService.ctor", () => {
    it("should be contructed", () => {
        let stateService: StateService = new StateService();

        expect(stateService).toBeDefined();
    });
});
