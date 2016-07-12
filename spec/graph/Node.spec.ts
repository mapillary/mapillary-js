/// <reference path="../../typings/index.d.ts" />

import {IAPINavImIm, IAPINavImS} from "../../src/API";
import {Node, Sequence} from "../../src/Graph";

describe("Node", () => {
    let sequence: Sequence;

    beforeEach(() => {
        let response: IAPINavImS = {
            key: "A",
            keys: ["B", "C", "D", "E"],
            path: { },
        };

        sequence = new Sequence(response);
    });

    it("should create a node", () => {
        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, { key: "C" }, null);
        expect(node).toBeDefined();
    });

    it("should find next node key in nodes sequence", () => {
        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, { key: "C" }, null);
        expect(node.findNextKeyInSequence()).toEqual("D");
    });

    it("should find prev node key in nodes sequence", () => {
        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, { key: "C" }, null);
        expect(node.findPrevKeyInSequence()).toEqual("B");
    });

    it("should return null if no next key", () => {
        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, { key: "E" }, null);
        expect(node.findNextKeyInSequence()).toBe(null);
    });

    it("should return null if no prev key", () => {
        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, { key: "B" }, null);
        expect(node.findPrevKeyInSequence()).toBe(null);
    });

    it("should not be merged", () => {
        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, { key: "B" }, null);
        expect(node.merged).toBe(false);
    });

    it("should not be merged because merge version is zero", () => {
        let apiNavImIm: IAPINavImIm = { key: "B", merge_version: 0};

        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null);
        expect(node.merged).toBe(false);
    });

    it("should be merged because merge version present and larger than zero", () => {
        let apiNavImIm: IAPINavImIm = { key: "B", merge_version: 4};

        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null);
        expect(node.merged).toBe(true);
    });

    it("should not be full pano when gpano is null", () => {
        let apiNavImIm: IAPINavImIm = {  gpano: null, key: "B" };

        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null);
        expect(node.fullPano).toBe(false);
    });

    it("should not be full pano when cropped left", () => {
        let apiNavImIm: IAPINavImIm = {
            gpano: {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0.5,
                CroppedAreaTopPixels: 0,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            },
            key: "B",
        };

        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null);
        expect(node.fullPano).toBe(false);
    });

    it("should not be full pano when cropped top", () => {
        let apiNavImIm: IAPINavImIm = {
            gpano: {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0.5,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            },
            key: "B",
        };

        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null);
        expect(node.fullPano).toBe(false);
    });

    it("should not be full pano when cropped right", () => {
        let apiNavImIm: IAPINavImIm = {
            gpano: {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 0.5,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            },
            key: "B",
        };

        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null);
        expect(node.fullPano).toBe(false);
    });

    it("should not be full pano when cropped bottom", () => {
        let apiNavImIm: IAPINavImIm = {
            gpano: {
                CroppedAreaImageHeightPixels: 0.5,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            },
            key: "B",
        };

        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null);
        expect(node.fullPano).toBe(false);
    });

    it("should be full pano", () => {
        let apiNavImIm: IAPINavImIm = {
            gpano: {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            },
            key: "B",
        };

        let node: Node = new Node(0, {lat: 1, lon: 1}, true, sequence, apiNavImIm, null);
        expect(node.fullPano).toBe(true);
    });
});
