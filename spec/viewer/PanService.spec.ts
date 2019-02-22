import { Subject } from "rxjs";

import { PanService } from "../../src/viewer/PanService";
import GraphServiceMockCreator from "../helper/GraphServiceMockCreator.spec";
import StateServiceMockCreator from "../helper/StateServiceMockCreator.spec";
import { Transform } from "../../src/geo/Transform";
import { GraphService, Node } from "../../src/Graph";
import { StateService, IFrame } from "../../src/State";
import NodeHelper from "../helper/NodeHelper.spec";
import { FrameHelper } from "../helper/FrameHelper.spec";
import { ILatLonAlt } from "../../src/Geo";

describe("PanService.ctor", () => {
    it("should be defined when constructed", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const panService: PanService = new PanService(graphService, stateService);

        expect(panService).toBeDefined();
    });
});

describe("PanService.panNodes$", () => {
    it("should be defined when constructed", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const cacheBoundingBoxSubject: Subject<Node[]> = new Subject<Node[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);

        panService.panNodes$.subscribe(
            (nodes: [Node, Transform][]): void => {
                expect(nodes.length).toBe(0);
                done();
            });

        (<Subject<IFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Node>>stateService.currentNode$).next(new NodeHelper().createNode());
        (<Subject<ILatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
        cacheBoundingBoxSubject.next([]);

        expect(panService).toBeDefined();
    });
});
