///<reference path="../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;
var viewer = new Mapillary.Viewer('mapillary', 'MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4', {ui: "none", uiList: ["none"]});

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
        var response: any = viewer.moveToKey("XkK3qsRg9j9UY5jTg8BKGQ");

        response.then((node: any) => {
            // fixme depends on real API data
            expect(node.key).toBe("XkK3qsRg9j9UY5jTg8BKGQ");
            response = viewer.moveDir(Mapillary.GraphConstants.DirEnum.NEXT);

            response.then((node: any) => {
                expect(node.key).toBe("EUTk0zsxzVgIyE6XeO-yWQ");
                done();
            });
        });
    });
});
