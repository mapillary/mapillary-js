/// <reference path="../typings/jasmine/jasmine.d.ts" />

import {VCR} from "../src/VCR";

describe("Teardown", () => {
    it("should do teardown activity", () => {
        if (process.env.VCR === 'recording') {
            VCR.printInstructions();
        }
    });
});
