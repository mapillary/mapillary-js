import Viewer from "../src/Viewer"
var viewer = new Mapillary.Viewer('test', {'node': 'testing'})

describe("Viewer", () => {
    it("exists", () => {
        expect(viewer).toBeDefined()
    )}
})
