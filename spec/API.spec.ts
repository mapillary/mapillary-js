/// <reference path="../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;
var viewer = new Mapillary.Viewer('mapillary', 'MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4');

describe("APIv2", () => {
    var apiV2 = viewer.prefetcher.apiV2;

    it("exists", () => {
        expect(apiV2).toBeDefined();
    });
});

// describe("API.apiV2.nav", () => {
//     var nav = viewer.prefetcher.apiV2.nav;
//
//     it("exists", () => {
//         expect(nav).toBeDefined();
//     });
//
//     it("calls h", (done) => {
//         var h = nav.h("u3ck26t");
//         h.then((response: any) => {
//             // FIXME TEST SHOULD NEVER CALL EXTERNAL STUFF
//             // THIS IS PURE FOR SHOW FOR NOW
//             expect(response.entity.hs[0]).toBe('u3ck26t');
//             done();
//         });
//     });
//
//     it("calls im", (done) => {
//         var im = nav.im("h_tzkTklF6DZfU5plCA9Cw");
//         im.then((response: any) => {
//             var resp = nav.parseIm(response)
//             // FIXME TEST SHOULD NEVER CALL EXTERNAL STUFF
//             // THIS IS PURE FOR SHOW FOR NOW
//             expect(response.entity.hs[0]).toBe('u3ck26d');
//             done();
//         });
//     });
// });
