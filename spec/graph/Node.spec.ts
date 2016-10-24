/// <reference path="../../typings/index.d.ts" />

import {IAPINavImIm, IAPINavImS, ICoreNode, IFillNode} from "../../src/API";
import {IMesh, NewNode, NewNodeCache, Node, Sequence} from "../../src/Graph";

let createCoreNode: () => ICoreNode = (): ICoreNode => {
    return {
        cl: { lat: 0, lon: 0},
        key: "key",
        l: { lat: 0, lon: 0 },
        sequence: { key: "skey" },
    };
};

let createFillNode: () => IFillNode = (): IFillNode => {
    return {
        atomic_scale: 0,
        c_rotation: [0, 0, 0],
        ca: 0,
        calt: 0,
        captured_at: 0,
        cca: 0,
        cfocal: 0,
        gpano: null,
        height: 0,
        merge_cc: 0,
        merge_version: 0,
        orientation: 0,
        user: { key: "key", username: "username"},
        width: 0,
    };
};

describe("NewNode", () => {
    it("should create a node", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);

        expect(node).toBeDefined();
    });
});

describe("NewNode.full", () => {
    it("should make node full", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);

        expect(node.full).toBe(false);

        let fillNode: IFillNode = createFillNode();

        node.makeFull(fillNode);

        expect(node.full).toBe(true);
    });

    it("should throw when fill is null", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);

        expect(() => { node.makeFull(null); }).toThrowError(Error);
    });
});

describe("NewNode.dispose", () => {
    it("should clear core and fill properties", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();
        node.makeFull(fillNode);

        node.dispose();

        expect(node.full).toBe(false);

        expect(() => { return node.key; }).toThrowError(Error);
    });

    it("should dipose cache", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let nodeCache: NewNodeCache = new NewNodeCache();

        let disposeSpy: jasmine.Spy = spyOn(nodeCache, "dispose");
        disposeSpy.and.stub();

        node.initializeCache(nodeCache);

        node.dispose();

        expect(disposeSpy.calls.count()).toBe(1);
    });
});

describe("NewNode.fullPano", () => {
    it("should not be a full pano when gpano does not exist", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.gpano = null;

        node.makeFull(fillNode);

        expect(node.fullPano).toBe(false);
    });

    it("should not be full pano when cropped left", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.gpano = {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0.5,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        node.makeFull(fillNode);

        expect(node.fullPano).toBe(false);
    });

    it("should not be full pano when cropped top", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.gpano = {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0.5,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        node.makeFull(fillNode);

        expect(node.fullPano).toBe(false);
    });

    it("should not be full pano when cropped right", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.gpano = {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 0.5,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        node.makeFull(fillNode);

        expect(node.fullPano).toBe(false);
    });

    it("should not be full pano when cropped bottom", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.gpano = {
            CroppedAreaImageHeightPixels: 0.5,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        node.makeFull(fillNode);

        expect(node.fullPano).toBe(false);
    });

    it("should be full pano", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.gpano = {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        node.makeFull(fillNode);

        expect(node.fullPano).toBe(true);
    });
});

describe("NewNode.pano", () => {
    it("should not be a pano when gpano does not exist", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.gpano = null;

        node.makeFull(fillNode);

        expect(node.pano).toBe(false);
    });

    it("should be a pano", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.gpano = {
            CroppedAreaImageHeightPixels: 0.5,
            CroppedAreaImageWidthPixels: 0.5,
            CroppedAreaLeftPixels: 0.25,
            CroppedAreaTopPixels: 0.25,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        node.makeFull(fillNode);

        expect(node.pano).toBe(true);
    });
});

describe("NewNode.merged", () => {
    it("should not be merged when not full", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);

        expect(node.merged).toBe(false);
    });

    it("should not be merged because merge version is zero", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.merge_version = 0;

        node.makeFull(fillNode);

        expect(node.merged).toBe(false);
    });

    it("should be merged because merge version present and larger than zero", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();

        fillNode.merge_version = 7;

        node.makeFull(fillNode);

        expect(node.merged).toBe(true);
    });
});

describe("NewNode.assetsCached", () => {
    it("should not be cached when core", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);

        expect(node.assetsCached).toBe(false);
    });

    class NewNodeCacheMock extends NewNodeCache {
        protected _overridingImage: HTMLImageElement;
        protected _overridingMesh: IMesh;

        public get image(): HTMLImageElement {
            return this._overridingImage;
        }

        public set image(value: HTMLImageElement) {
            this._overridingImage = value;
        }

        public get mesh(): IMesh {
            return this._overridingMesh;
        }

        public set mesh(value: IMesh) {
            this._overridingMesh = value;
        }
    }

    it("should be cached when assets set", () => {
        let coreNode: ICoreNode = createCoreNode();
        let node: NewNode = new NewNode(coreNode);
        let fillNode: IFillNode = createFillNode();
        node.makeFull(fillNode);

        let nodeCache: NewNodeCacheMock = new NewNodeCacheMock();
        nodeCache.image = new Image();
        nodeCache.mesh = { faces: [], vertices: [] };

        node.initializeCache(nodeCache);

        expect(node.assetsCached).toBe(true);
    });
});

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
