/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {IAPINavImIm} from "../../src/API";
import {Node, Sequence} from "../../src/Graph";

describe("Node", () => {
    var sequence: Sequence;

    beforeEach(() => {
        let response: any = {
            key: 'A',
            keys: ['B','C','D','E'],
            path: {}
        }
        sequence = new Sequence(response);
    });

    it("should create a node", () => {
        let node: Node = new Node("C", 0, {lat: 1, lon: 1}, true, sequence, null, null, null);
        expect(node).toBeDefined();
    });

    it("should find next node key in nodes sequence", () => {
        let node: Node = new Node("C", 0, {lat: 1, lon: 1}, true, sequence, null, null, null);
        expect(node.findNextKeyInSequence()).toEqual('D')
    });

    it("should find prev node key in nodes sequence", () => {
        let node: Node = new Node("C", 0, {lat: 1, lon: 1}, true, sequence, null, null, null);
        expect(node.findPrevKeyInSequence()).toEqual('B')
    });

    it("should return null if no next key", () => {
        let node: Node = new Node("E", 0, {lat: 1, lon: 1}, true, sequence, null, null, null);
        expect(node.findNextKeyInSequence()).toBe(null)
    });

    it("should return null if no prev key", () => {
        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, null, null, null);
        expect(node.findPrevKeyInSequence()).toBe(null)
    });

    it("should not be merged", () => {
        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, null, null, null);
        expect(node.merged).toBe(false)
    });

    it("should not be merged because merge version is zero", () => {
        let apiNavImIm: IAPINavImIm = { key: "B", merge_version: 0}

        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null, null);
        expect(node.merged).toBe(false)
    });

    it("should be merged because merge version present and larger than zero", () => {
        let apiNavImIm: IAPINavImIm = { key: "B", merge_version: 4}

        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null, null);
        expect(node.merged).toBe(true)
    });

    it("should not be full pano when gpano is null", () => {
        let apiNavImIm: IAPINavImIm = { key: "B", gpano: null }

        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null, null);
        expect(node.fullPano).toBe(false)
    });

    it("should not be full pano when cropped left", () => {
        let apiNavImIm: IAPINavImIm = {
            key: "B",
            gpano: {
                CroppedAreaLeftPixels: 0.5,
                CroppedAreaTopPixels: 0,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaImageHeightPixels: 1,
                FullPanoWidthPixels: 1,
                FullPanoHeightPixels: 1
            }
        };

        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null, null);
        expect(node.fullPano).toBe(false)
    });

    it("should not be full pano when cropped top", () => {
        let apiNavImIm: IAPINavImIm = {
            key: "B",
            gpano: {
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0.5,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaImageHeightPixels: 1,
                FullPanoWidthPixels: 1,
                FullPanoHeightPixels: 1
            }
        };

        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null, null);
        expect(node.fullPano).toBe(false)
    });

    it("should not be full pano when cropped right", () => {
        let apiNavImIm: IAPINavImIm = {
            key: "B",
            gpano: {
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                CroppedAreaImageWidthPixels: 0.5,
                CroppedAreaImageHeightPixels: 1,
                FullPanoWidthPixels: 1,
                FullPanoHeightPixels: 1
            }
        };

        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null, null);
        expect(node.fullPano).toBe(false)
    });

    it("should not be full pano when cropped bottom", () => {
        let apiNavImIm: IAPINavImIm = {
            key: "B",
            gpano: {
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaImageHeightPixels: 0.5,
                FullPanoWidthPixels: 1,
                FullPanoHeightPixels: 1
            }
        };

        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null, null);
        expect(node.fullPano).toBe(false)
    });

    it("should be full pano", () => {
        let apiNavImIm: IAPINavImIm = {
            key: "B",
            gpano: {
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaImageHeightPixels: 1,
                FullPanoWidthPixels: 1,
                FullPanoHeightPixels: 1
            }
        };

        let node: Node = new Node("B", 0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null, null);
        expect(node.fullPano).toBe(true)
    });
});