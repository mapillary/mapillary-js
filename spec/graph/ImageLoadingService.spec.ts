import {skip} from "rxjs/operators";
import {NodeHelper} from "../helper/NodeHelper.spec";
import {MockCreator} from "../helper/MockCreator.spec";

import {ICoreNode} from "../../src/API";
import {
    ILoadStatus,
    ImageLoadingService,
    Node,
} from "../../src/Graph";

describe("ImageLoadingService.ctor", () => {
    it("should create an image loading service", () => {
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();

        expect(imageLoadingService).toBeDefined();
    });
});

describe("ImageLoadingService.loadStatus$", () => {
    it("should emit for new node with loaded bytes", () => {
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();

        const coreNode: ICoreNode = new NodeHelper().createCoreNode();
        coreNode.key = "nodeKey";
        const node: Node = new Node(coreNode);
        new MockCreator().mockProperty<Node, ILoadStatus>(node, "loadStatus", { loaded: 10, total: 100 });

        let loadStatusEmitCount: number = 0;
        imageLoadingService.loadstatus$
            .subscribe(
                (nodes: { [key: string]: ILoadStatus }): void => {
                    loadStatusEmitCount++;
                    expect(node.key in nodes).toBe(true);
                    expect(Object.keys(nodes).length).toBe(1);
                });

        imageLoadingService.loadnode$.next(node);

        expect(loadStatusEmitCount).toBe(1);
    });

    it("should emit when load status for node changes", () => {
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();

        const coreNode: ICoreNode = new NodeHelper().createCoreNode();
        coreNode.key = "nodeKey";
        const node: Node = new Node(coreNode);
        const loadStatus: ILoadStatus = { loaded: 10, total: 100 };
        new MockCreator().mockProperty<Node, ILoadStatus>(node, "loadStatus", loadStatus);

        let loadStatusEmitCount: number = 0;
        imageLoadingService.loadstatus$
            .subscribe(
                (nodes: { [key: string]: ILoadStatus }): void => {
                    loadStatusEmitCount++;
                    expect(node.key in nodes).toBe(true);
                    expect(Object.keys(nodes).length).toBe(1);
                });

        imageLoadingService.loadnode$.next(node);

        expect(loadStatusEmitCount).toBe(1);

        loadStatus.loaded = 20;
        imageLoadingService.loadnode$.next(node);

        expect(loadStatusEmitCount).toBe(2);
    });

    it("should remove node and emit when node is totally loaded", () => {
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();

        const coreNode: ICoreNode = new NodeHelper().createCoreNode();
        coreNode.key = "nodeKey";
        const node: Node = new Node(coreNode);
        const loadStatus: ILoadStatus = { loaded: 10, total: 100 };
        new MockCreator().mockProperty<Node, ILoadStatus>(node, "loadStatus", loadStatus);

        let loadStatusEmitCount: number = 0;
        imageLoadingService.loadstatus$.pipe(
            skip(1))
            .subscribe(
                (nodes: { [key: string]: ILoadStatus }): void => {
                    loadStatusEmitCount++;
                    expect(node.key in nodes).toBe(false);
                    expect(Object.keys(nodes).length).toBe(0);
                });

        imageLoadingService.loadnode$.next(node);

        expect(loadStatusEmitCount).toBe(0);

        loadStatus.loaded = 100;
        imageLoadingService.loadnode$.next(node);

        expect(loadStatusEmitCount).toBe(1);
    });

    it("should not emit for new node with zero total bytes", () => {
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();

        let loadStatusEmitCount: number = 0;
        imageLoadingService.loadstatus$
            .subscribe(
                (nodes: { [key: string]: ILoadStatus }): void => {
                    loadStatusEmitCount++;
                });

        const coreNode: ICoreNode = new NodeHelper().createCoreNode();
        coreNode.key = "nodeKey";
        const node: Node = new Node(coreNode);
        new MockCreator().mockProperty<Node, ILoadStatus>(node, "loadStatus", { loaded: 0, total: 0 });
        imageLoadingService.loadnode$.next(node);

        expect(loadStatusEmitCount).toBe(0);
    });

    it("should not emit for new node with fully loaded bytes", () => {
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();

        let loadStatusEmitCount: number = 0;
        imageLoadingService.loadstatus$
            .subscribe(
                (nodes: { [key: string]: ILoadStatus }): void => {
                    loadStatusEmitCount++;
                });

        const coreNode: ICoreNode = new NodeHelper().createCoreNode();
        coreNode.key = "nodeKey";
        const node: Node = new Node(coreNode);
        new MockCreator().mockProperty<Node, ILoadStatus>(node, "loadStatus", { loaded: 100, total: 100 });
        imageLoadingService.loadnode$.next(node);

        expect(loadStatusEmitCount).toBe(0);
    });
});
