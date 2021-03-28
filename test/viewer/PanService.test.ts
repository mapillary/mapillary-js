import { Subject } from "rxjs";
import { skip } from "rxjs/operators";

import { Image } from "../../src/graph/Image";
import { Transform } from "../../src/geo/Transform";
import { LatLonAlt } from "../../src/api/interfaces/LatLonAlt";
import { GraphService } from "../../src/graph/GraphService";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { StateService } from "../../src/state/StateService";
import { PanService } from "../../src/viewer/PanService";
import { FrameHelper } from "../helper/FrameHelper";
import { GraphServiceMockCreator } from "../helper/GraphServiceMockCreator";
import { ImageHelper } from "../helper/ImageHelper";
import { StateServiceMockCreator } from "../helper/StateServiceMockCreator";

describe("PanService.ctor", () => {
    it("should be defined when constructed", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const panService: PanService = new PanService(graphService, stateService);

        expect(panService).toBeDefined();
    });
});

describe("PanService.panImages$", () => {
    it("should emit empty initially", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const cacheBoundingBoxSubject: Subject<Image[]> = new Subject<Image[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);

        panService.panImages$.subscribe(
            (images: [Image, Transform, number][]): void => {
                expect(images.length).toBe(0);
                done();
            });

        (<Subject<AnimationFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Image>>stateService.currentImage$).next(new ImageHelper().createImage());
        (<Subject<LatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
    });

    it("should emit", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const cacheBoundingBoxSubject: Subject<Image[]> = new Subject<Image[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);
        panService.start();

        panService.panImages$.pipe(
            skip(1))
            .subscribe(
                (images: [Image, Transform, number][]): void => {
                    expect(images.length).toBe(0);
                    done();
                });

        (<Subject<AnimationFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Image>>stateService.currentImage$).next(new ImageHelper().createImage());
        (<Subject<LatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
        cacheBoundingBoxSubject.next([]);
    });

    it("should emit empty when not merged", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const cacheBoundingBoxSubject: Subject<Image[]> = new Subject<Image[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);
        panService.start();

        panService.panImages$.pipe(
            skip(1))
            .subscribe(
                (images: [Image, Transform, number][]): void => {
                    expect(images.length).toBe(0);
                    done();
                });

        (<Subject<AnimationFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Image>>stateService.currentImage$).next(new ImageHelper().createUnmergedImage());
        (<Subject<LatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
        cacheBoundingBoxSubject.next([]);
    });

    it("should catch error and keep emitting", () => {
        spyOn(console, "error").and.stub();

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const erroredCacheBoundingBoxSubject: Subject<Image[]> = new Subject<Image[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(erroredCacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);
        panService.start();

        let emitCount: number = 0;
        panService.panImages$.pipe(skip(1))
            .subscribe(
                (): void => {
                    emitCount++;
                });

        (<Subject<AnimationFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Image>>stateService.currentImage$).next(new ImageHelper().createImage());
        (<Subject<LatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
        erroredCacheBoundingBoxSubject.error(new Error());

        expect(emitCount).toBe(1);

        const cacheBoundingBoxSubject: Subject<Image[]> = new Subject<Image[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        (<Subject<Image>>stateService.currentImage$).next(new ImageHelper().createImage());
        (<Subject<LatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });

        cacheBoundingBoxSubject.next([]);

        expect(emitCount).toBe(3);
    });

    it("should emit after being disabled", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const stateService: StateService = new StateServiceMockCreator().create();

        const cacheBoundingBoxSubject: Subject<Image[]> = new Subject<Image[]>();
        (<jasmine.Spy>graphService.cacheBoundingBox$).and.returnValue(cacheBoundingBoxSubject);

        const panService: PanService = new PanService(graphService, stateService);
        panService.start();
        panService.disable();
        panService.enable();

        panService.panImages$.pipe(
            skip(1))
            .subscribe(
                (images: [Image, Transform, number][]): void => {
                    expect(images.length).toBe(0);
                    done();
                });

        (<Subject<AnimationFrame>>stateService.currentState$).next(new FrameHelper().createFrame());
        (<Subject<Image>>stateService.currentImage$).next(new ImageHelper().createImage());
        (<Subject<LatLonAlt>>stateService.reference$).next({ alt: 0, lat: 0, lon: 0 });
        cacheBoundingBoxSubject.next([]);
    });
});
