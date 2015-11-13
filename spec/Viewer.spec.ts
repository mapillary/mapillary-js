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
        var response: any = viewer.moveToKey("7bzPYiyMdQI1zSoi4Gk2_w");

        response.then((node: any) => {
            // fixme depends on real API data
            expect(node.key).toBe("7bzPYiyMdQI1zSoi4Gk2_w");
            response = viewer.moveDir(Mapillary.GraphConstants.DirEnum.NEXT);

            response.then((node: any) => {
                expect(node.key).toBe("PoSGroz_MT1PpaNPGV6PvA");
                done();
            });
        });
    });
});
