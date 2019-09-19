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
import { skip } from "rxjs/operators";

describe("PanService.ctor", () => {
    it("should be defined when constructed", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const panService: PanService = new PanService(graphService, stateService);

        expect(panService).toBeDefined();
    });
});

describe("PanService.panNodes$", () => {
    it("should emit empty initially", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const cacheBoundingBoxSubject: Subject<Node[]> = new Subject<Node[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);

        panService.panNodes$.subscribe(
            (nodes: [Node, Transform, number][]): void => {
                expect(nodes.length).toBe(0);
                done();
            });

        (<Subject<IFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Node>>stateService.currentNode$).next(new NodeHelper().createNode());
        (<Subject<ILatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
    });

    it("should emit", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const cacheBoundingBoxSubject: Subject<Node[]> = new Subject<Node[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);
        panService.start();

        panService.panNodes$.pipe(
            skip(1))
            .subscribe(
            (nodes: [Node, Transform, number][]): void => {
                expect(nodes.length).toBe(0);
                done();
            });

        (<Subject<IFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Node>>stateService.currentNode$).next(new NodeHelper().createNode());
        (<Subject<ILatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
        cacheBoundingBoxSubject.next([]);
    });

    it("should emit empty when not merged", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const cacheBoundingBoxSubject: Subject<Node[]> = new Subject<Node[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);
        panService.start();

        panService.panNodes$.pipe(
            skip(1))
            .subscribe(
            (nodes: [Node, Transform, number][]): void => {
                expect(nodes.length).toBe(0);
                done();
            });

        (<Subject<IFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Node>>stateService.currentNode$).next(new NodeHelper().createUnmergedNode());
        (<Subject<ILatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
        cacheBoundingBoxSubject.next([]);
    });

    it("should catch error and keep emitting", () => {
        spyOn(console, "error").and.stub();

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const erroredCacheBoundingBoxSubject: Subject<Node[]> = new Subject<Node[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(erroredCacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);
        panService.start();

        let emitCount: number = 0;
        panService.panNodes$.pipe(skip(1))
            .subscribe(
                (): void => {
                    emitCount++;
                });

        (<Subject<IFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Node>>stateService.currentNode$).next(new NodeHelper().createNode());
        (<Subject<ILatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
        erroredCacheBoundingBoxSubject.error(new Error());

        expect(emitCount).toBe(1);

        const cacheBoundingBoxSubject: Subject<Node[]> = new Subject<Node[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        (<Subject<Node>>stateService.currentNode$).next(new NodeHelper().createNode());
        (<Subject<ILatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });

        cacheBoundingBoxSubject.next([]);

        expect(emitCount).toBe(3);
    });

    it("should emit after being disabled", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const cacheBoundingBoxSubject: Subject<Node[]> = new Subject<Node[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);
        panService.start();
        panService.disable();
        panService.enable();

        panService.panNodes$.pipe(
            skip(1))
            .subscribe(
            (nodes: [Node, Transform, number][]): void => {
                expect(nodes.length).toBe(0);
                done();
            });

        (<Subject<IFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Node>>stateService.currentNode$).next(new NodeHelper().createNode());
        (<Subject<ILatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
        cacheBoundingBoxSubject.next([]);
    });
});
