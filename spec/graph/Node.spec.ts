/// <reference path="../../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;

describe("Node", () => {
    var sequence: any;

    beforeEach(() => {
        let response: any = {
            key: 'A',
            keys: ['B','C','D','E'],
            path: {}
        }
        sequence = new Mapillary.Sequence(response);
    });

    it("should create a node", () => {
        let node: any = new Mapillary.Node("C", 0, {lat: 1, lon: 1}, true, sequence, null);
        expect(node).toBeDefined();
    });

    it("should find next node key in nodes sequence", () => {
        let node: any = new Mapillary.Node("C", 0, {lat: 1, lon: 1}, true, sequence, null);
        expect(node.findNextKeyInSequence()).toEqual('D')
    });

    it("should find prev node key in nodes sequence", () => {
        let node: any = new Mapillary.Node("C", 0, {lat: 1, lon: 1}, true, sequence, null);
        expect(node.findPrevKeyInSequence()).toEqual('B')
    });

    it("should return null if no next key", () => {
        let node: any = new Mapillary.Node("E", 0, {lat: 1, lon: 1}, true, sequence, null);
        expect(node.findNextKeyInSequence()).toBe(null)
    });

    it("should return null if no prev key", () => {
        let node: any = new Mapillary.Node("B", 0, {lat: 1, lon: 1}, true, sequence, null);
        expect(node.findPrevKeyInSequence()).toBe(null)
    });
});