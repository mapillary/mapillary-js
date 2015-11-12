///<reference path="../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;
var viewer = new Mapillary.Viewer('mapillary', 'MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4');

describe("Viewer", () => {
    it("exists", () => {
        expect(viewer).toBeDefined();
    });
});

describe("Viewer.moveToKey", () => {
    it("should throw error if key is not set", () => {
        expect(() => {
            viewer.moveToKey(null);
        }).toThrowError("The function was not called with correct parameters");
    });

    it("should move to a key", (done) => {
        viewer.moveToKey("h_tzkTklF6DZfU5plCA9Cw", (data: any) => {
            done();
        });
    });
});
