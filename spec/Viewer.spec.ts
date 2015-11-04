///<reference path="../typings/jasmine/jasmine.d.ts" />

declare var mapillaryjs: any;

import Viewer from "../src/Viewer"
var viewer = new mapillaryjs.Viewer('test', {'node': 'testing'})

describe("Viewer", () =>
    it("exists", () =>
        expect(viewer).toBeDefined())        
);
