/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/when/when.d.ts" />

import * as when from "when";

import {APIv2, IAPINavIm, IAPIImOr} from "../../src/API";

describe("APIv2", () => {
    var apiV2: APIv2;

    beforeEach(() => {
        apiV2 = new APIv2("clientId")
    });

    it("exists", () => {
        expect(apiV2).toBeDefined();
    });

    it("calls im or", (done) => {
        spyOn(apiV2.im, "callApi").and.returnValue(when(null));

        let im: string = "key";
        apiV2.im.callOr(im).then((response: IAPIImOr) => {
            expect(apiV2.im.callApi).toHaveBeenCalledWith("im/" + im + "/or");

            done();
        });
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
