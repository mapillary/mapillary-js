import { NodeHelper } from "../helper/NodeHelper";
import { Node } from "../../src/graph/Node";
import { ICoreNode } from "../../src/api/interfaces/ICoreNode";
import { IFillNode } from "../../src/api/interfaces/IFillNode";
import { IMesh } from "../../src/api/interfaces/IMesh";
import { NodeCache } from "../../src/graph/NodeCache";

describe("Node", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should create a node", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);

        expect(node).toBeDefined();
    });
});

describe("Node.full", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should make node full", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);

        expect(node.full).toBe(false);

        let fillNode: IFillNode = helper.createFillNode();

        node.makeFull(fillNode);

        expect(node.full).toBe(true);
    });

    it("should throw when fill is null", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);

        expect(() => { node.makeFull(null); }).toThrowError(Error);
    });
});

describe("Node.dispose", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should clear core and fill properties", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);
        let fillNode: IFillNode = helper.createFillNode();
        node.makeFull(fillNode);

        node.dispose();

        expect(node.full).toBe(false);

        expect(() => { return node.key; }).toThrowError(Error);
    });

    it("should dipose cache", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);
        let nodeCache: NodeCache = new NodeCache(undefined);

        let disposeSpy: jasmine.Spy = spyOn(nodeCache, "dispose");
        disposeSpy.and.stub();

        node.initializeCache(nodeCache);

        node.dispose();

        expect(disposeSpy.calls.count()).toBe(1);
    });
});

describe("Node.uncache", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should handle when cache is not initilized", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);

        node.uncache();
    });

    it("should dispose node cache", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);
        let nodeCache: NodeCache = new NodeCache(undefined);

        let disposeSpy: jasmine.Spy = spyOn(nodeCache, "dispose");
        disposeSpy.and.stub();

        node.initializeCache(nodeCache);

        node.uncache();

        expect(disposeSpy.calls.count()).toBe(1);
    });

    it("should be able to initialize cache again after uncache", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);
        let nodeCache: NodeCache = new NodeCache(undefined);

        let disposeSpy: jasmine.Spy = spyOn(nodeCache, "dispose");
        disposeSpy.and.stub();

        node.initializeCache(nodeCache);

        node.uncache();

        node.initializeCache(nodeCache);
    });
});

describe("Node.merged", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should not be merged when not full", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);

        expect(node.merged).toBe(false);
    });

    it("should not be merged because merge version is zero", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);
        let fillNode: IFillNode = helper.createFillNode();

        fillNode.merge_version = 0;

        node.makeFull(fillNode);

        expect(node.merged).toBe(false);
    });

    it("should be merged because merge version present and larger than zero", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);
        let fillNode: IFillNode = helper.createFillNode();

        fillNode.merge_version = 7;

        node.makeFull(fillNode);

        expect(node.merged).toBe(true);
    });
});

describe("Node.assetsCached", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should not be cached when core", () => {
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);

        expect(node.assetsCached).toBe(false);
    });

    class NodeCacheMock extends NodeCache {
        protected _overridingImage: HTMLImageElement;
        protected _overridingMesh: IMesh;

        constructor() { super(undefined); }

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
        let coreNode: ICoreNode = helper.createCoreNode();
        let node: Node = new Node(coreNode);
        let fillNode: IFillNode = helper.createFillNode();
        node.makeFull(fillNode);

        let nodeCache: NodeCacheMock = new NodeCacheMock();
        nodeCache.image = new Image();
        nodeCache.mesh = { faces: [], vertices: [] };

        node.initializeCache(nodeCache);

        expect(node.assetsCached).toBe(true);
    });
});
