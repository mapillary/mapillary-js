var viewer = new mapillaryjs.Viewer('viewer', { node: 'test' })

describe("Viewer", () =>
    it("exists", () =>
        expect(viewer).toBeDefined())        
);
