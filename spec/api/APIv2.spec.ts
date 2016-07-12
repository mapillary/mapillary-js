/// <reference path="../../typings/index.d.ts" />

import * as when from "when";

import {APIv2, IAPINavIm} from "../../src/API";

describe("APIv2", () => {
    let apiV2: APIv2;

    beforeEach(() => {
        apiV2 = new APIv2("clientId");
    });

    it("exists", () => {
        expect(apiV2).toBeDefined();
    });

    it("calls nav h", (done) => {
        spyOn(apiV2.nav, "callApi").and.returnValue(when(null));

        let h: string = "hash";
        apiV2.nav.h(h).then((response: IAPINavIm) => {
            expect(apiV2.nav.callApi).toHaveBeenCalledWith("nav/h/" + h);

            done();
        });
    });

    it("calls nav im", (done) => {
        spyOn(apiV2.nav, "callApi").and.returnValue(when(null));

        let im: string = "key";
        apiV2.nav.im(im).then((response: IAPINavIm) => {
            expect(apiV2.nav.callApi).toHaveBeenCalledWith("nav/im/" + im);

            done();
        });
    });
});
