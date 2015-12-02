/// <reference path="../typings/jasmine/jasmine.d.ts" />

import {APIv2, IAPINavIm} from "../src/API";

describe("APIv2", () => {
    var apiV2: APIv2;

    beforeEach(() => {
        apiV2 = new APIv2("MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4")
    });

    it("exists", () => {
        expect(apiV2).toBeDefined();
    });

    it("calls h", (done) => {
        apiV2.nav.h("u3ck26t").then((response: IAPINavIm) => {
            done();
        });
    });

    it("calls im", (done) => {
        apiV2.nav.im("h_tzkTklF6DZfU5plCA9Cw").then((response: IAPINavIm) => {
            done();
        });
    });
});