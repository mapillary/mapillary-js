///<reference path="../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;

import {API} from "../src/API";
var viewer = new Mapillary.Viewer('mapillary', 'MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzozODVmNDk5ODE2ZDFiZWZm');

describe("API.apiV2", () => {
    var apiV2 = viewer.apiV2;

    it("exists", () => {
        expect(apiV2).toBeDefined();
    });
});

describe("API.apiV2.nav", () => {
    var nav = viewer.apiV2.nav;

    it("exists", () => {
        expect(nav).toBeDefined();
    });

    it("calls h", (done) => {
        var h = nav.h("u3ck26t");
        h.then((response) => {
            // FIXME TEST SHOULD NEVER CALL EXTERNAL STUFF
            // THIS IS PURE FOR SHOW FOR NOW
            expect(response.entity.hs[0]).toBe('u3ck26t');
            done();
        });
    });

    it("calls im", (done) => {
        var im = nav.im("h_tzkTklF6DZfU5plCA9Cw");
        im.then((response) => {
            // FIXME TEST SHOULD NEVER CALL EXTERNAL STUFF
            // THIS IS PURE FOR SHOW FOR NOW
            expect(response.entity.hs[0]).toBe('u3ck26d');
            done();
        });
    });
});
