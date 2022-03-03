import { bootstrap } from "../Bootstrap";
bootstrap();

import {
    of as observableOf,
    zip as observableZip,
    Observable,
    Subject,
} from "rxjs";
import { take, first, skip } from "rxjs/operators";
import { MockCreator } from "../helper/MockCreator";
import { ImageHelper } from "../helper/ImageHelper";
import { StateServiceMockCreator } from "../helper/StateServiceMockCreator";
import { FrameHelper } from "../helper/FrameHelper";
import { Image } from "../../src/graph/Image";
import { APIWrapper } from "../../src/api/APIWrapper";
import { ImageEnt } from "../../src/api/ents/ImageEnt";
import { Graph } from "../../src/graph/Graph";
import { GraphMode } from "../../src/graph/GraphMode";
import { GraphService } from "../../src/graph/GraphService";
import { NavigationEdgeStatus } from "../../src/graph/interfaces/NavigationEdgeStatus";
import { ImageCache } from "../../src/graph/ImageCache";
import { Sequence } from "../../src/graph/Sequence";
import { IAnimationState } from "../../src/state/interfaces/IAnimationState";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { State } from "../../src/state/State";
import { StateService } from "../../src/state/StateService";
import { PlayService } from "../../src/viewer/PlayService";
import { NavigationDirection } from "../../src/graph/edge/NavigationDirection";
import { DataProvider } from "../helper/ProviderHelper";

describe("PlayService.ctor", () => {
    it("should be defined when constructed", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const playService: PlayService = new PlayService(graphService, stateService);

        expect(playService).toBeDefined();
    });

    it("should emit default values", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const playService: PlayService = new PlayService(graphService, stateService);

        observableZip(
            playService.direction$,
            playService.playing$,
            playService.speed$).pipe(
                first())
            .subscribe(
                ([d, p, s]: [NavigationDirection, boolean, number]): void => {
                    expect(d).toBe(NavigationDirection.Next);
                    expect(p).toBe(false);
                    expect(s).toBe(0.5);

                    done();
                });
    });
});

describe("PlayService.playing", () => {
    it("should be playing after calling play", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.play();

        expect(playService.playing).toBe(true);

        playService.playing$
            .subscribe(
                (playing: boolean): void => {
                    expect(playing).toBe(true);

                    done();
                });
    });

    it("should not be playing after calling stop", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.play();

        const setGraphModeSpy: jasmine.Spy = spyOn(graphService, "setGraphMode").and.stub();
        const cutImagesSpy: jasmine.Spy = spyOn(stateService, "cutImages").and.stub();
        const setSpeedSpy: jasmine.Spy = spyOn(stateService, "setSpeed").and.stub();

        playService.stop();

        expect(setGraphModeSpy.calls.count()).toBe(1);
        expect(setGraphModeSpy.calls.argsFor(0)[0]).toBe(GraphMode.Spatial);

        expect(cutImagesSpy.calls.count()).toBe(1);

        expect(setSpeedSpy.calls.count()).toBe(1);
        expect(setSpeedSpy.calls.argsFor(0)[0]).toBe(1);

        expect(playService.playing).toBe(false);

        playService.playing$
            .subscribe(
                (playing: boolean): void => {
                    expect(playing).toBe(false);

                    done();
                });
    });
});

describe("PlayService.speed$", () => {
    it("should emit when changing speed", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.speed$.pipe(
            skip(1))
            .subscribe(
                (speed: number): void => {
                    expect(speed).toBe(0);

                    done();
                });

        playService.setSpeed(0);
    });

    it("should not emit when setting current speed", () => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.setSpeed(1);

        let speedEmitCount: number = 0;
        let firstEmit: boolean = true;
        playService.speed$.pipe(
            skip(1))
            .subscribe(
                (speed: number): void => {
                    speedEmitCount++;

                    if (firstEmit) {
                        expect(speed).toBe(0);
                        firstEmit = false;
                    } else {
                        expect(speed).toBe(1);
                    }
                });

        playService.setSpeed(0);
        playService.setSpeed(0);
        playService.setSpeed(1);
        playService.setSpeed(1);

        expect(speedEmitCount).toBe(2);
    });

    it("should clamp speed values to 0, 1 interval", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new DataProvider());
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const playService: PlayService = new PlayService(graphService, stateService);

        let firstEmit: boolean = true;
        playService.speed$.pipe(
            skip(1))
            .subscribe(
                (speed: number): void => {
                    if (firstEmit) {
                        expect(speed).toBe(0);
                        firstEmit = false;
                    } else {
                        expect(speed).toBe(1);

                        done();
                    }
                });

        playService.setSpeed(-1);
        playService.setSpeed(2);
    });
});

let createState: () => IAnimationState = (): IAnimationState => {
    return {
        alpha: 0,
        camera: null,
        currentCamera: null,
        currentIndex: 0,
        currentImage: null,
        currentTransform: null,
        lastImage: null,
        motionless: false,
        imagesAhead: 0,
        previousCamera: null,
        previousImage: null,
        previousTransform: null,
        reference: null,
        state: State.Traversing,
        stateTransitionAlpha: 0,
        trajectory: null,
        zoom: 0,
    };
};

describe("PlayService.play", () => {
    let imageHelper: ImageHelper;

    let api: APIWrapper;
    let graphService: GraphService;
    let stateService: StateService;

    beforeEach(() => {
        imageHelper = new ImageHelper();

        api = new APIWrapper(new DataProvider());
        graphService = new GraphService(new Graph(api));
        stateService = new StateServiceMockCreator().create();
    });

    it("should set graph mode when passing speed threshold", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const setGraphModeSpy: jasmine.Spy = spyOn(graphService, "setGraphMode").and.stub();

        playService.setSpeed(0);

        playService.play();

        playService.setSpeed(1);
        playService.setSpeed(0);

        expect(setGraphModeSpy.calls.count()).toBe(3);
        expect(setGraphModeSpy.calls.argsFor(0)[0]).toBe(GraphMode.Spatial);
        expect(setGraphModeSpy.calls.argsFor(1)[0]).toBe(GraphMode.Sequence);
        expect(setGraphModeSpy.calls.argsFor(2)[0]).toBe(GraphMode.Spatial);
    });

    it("should stop immediately if image does not have an edge in current direction and no bridge", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceImages$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(observableOf([]));

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        frame.state.currentImage.initializeCache(new ImageCache(undefined));
        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        frame.state.currentImage.cacheSequenceEdges([]);

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should stop if earth mode is emitted", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceImages$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(observableOf([]));

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        (<Subject<State>>stateService.state$).next(State.Earth);

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should stop if error occurs", () => {
        spyOn(console, "error").and.stub();

        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceImages$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(new Subject<Image[]>());

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();

        const image: Image = frame.state.currentImage;
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(image, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        sequenceEdgesSubject.error(new Error());

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should emit in correct order if stopping immediately", (done: () => void) => {
        const playService: PlayService = new PlayService(graphService, stateService);

        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceImages$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(observableOf([]));

        playService.setDirection(NavigationDirection.Next);

        let firstEmit: boolean = true;
        playService.playing$.pipe(
            skip(1),
            take(2))
            .subscribe(
                (playing: boolean): void => {
                    expect(playing).toBe(playService.playing);

                    if (firstEmit) {
                        expect(playing).toBe(true);
                        firstEmit = false;
                    } else {
                        expect(playing).toBe(false);
                        done();
                    }
                });

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        frame.state.currentImage.initializeCache(new ImageCache(undefined));
        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        frame.state.currentImage.cacheSequenceEdges([]);
    });

    it("should not stop if images are not cached", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceImages$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(observableOf([]));

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        const image: Image = frame.state.currentImage;
        image.initializeCache(new ImageCache(undefined));
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(image, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        sequenceEdgesSubject.next({ cached: false, edges: [] });

        expect(stopSpy.calls.count()).toBe(0);

        sequenceEdgesSubject.next({ cached: true, edges: [] });

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should stop if no more images", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceImages$").and.returnValue(new Subject<Sequence>());

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        const image: Image = frame.state.currentImage;
        image.initializeCache(new ImageCache(undefined));
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();

        const prevFullImage: ImageEnt = new ImageHelper().createImageEnt();
        prevFullImage.captured_at = -1;
        const prevImage: Image = new Image(prevFullImage);
        prevImage.makeComplete(prevFullImage);
        frame.state.trajectory.splice(0, 0, prevImage);
        frame.state.currentIndex = 1;

        new MockCreator().mockProperty(image, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        sequenceEdgesSubject.next({ cached: false, edges: [] });

        expect(stopSpy.calls.count()).toBe(0);

        sequenceEdgesSubject.next({ cached: true, edges: [] });

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should append image when cached", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const appendImagesSpy: jasmine.Spy = <jasmine.Spy>stateService.appendImagess;
        appendImagesSpy.and.callThrough();
        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        const cacheImageSubject: Subject<Image> = new Subject<Image>();
        cacheImageSpy.and.returnValue(cacheImageSubject);

        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceImages$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(new Subject<Image[]>());

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        const image: Image = frame.state.currentImage;
        image.initializeCache(new ImageCache(undefined));
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(image, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        const fullToImage: ImageEnt = imageHelper.createImageEnt();
        fullToImage.id = "toKey";
        const toImage: Image = new Image(fullToImage);

        sequenceEdgesSubject.next({
            cached: true,
            edges: [{
                data: { direction: NavigationDirection.Next, worldMotionAzimuth: 0 },
                source: image.id,
                target: toImage.id,
            }],
        });

        cacheImageSubject.next(toImage);

        expect(cacheImageSpy.calls.count()).toBe(1);
        expect(cacheImageSpy.calls.argsFor(0)[0]).toBe(toImage.id);

        expect(appendImagesSpy.calls.count()).toBe(1);
        expect(appendImagesSpy.calls.argsFor(0)[0].length).toBe(1);
        expect(appendImagesSpy.calls.argsFor(0)[0][0].id).toBe(toImage.id);
    });

    it("should stop on image caching error", () => {
        spyOn(console, "error").and.stub();

        const playService: PlayService = new PlayService(graphService, stateService);

        const appendImagesSpy: jasmine.Spy = <jasmine.Spy>stateService.appendImagess;
        appendImagesSpy.and.callThrough();
        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        const cacheImageSubject: Subject<Image> = new Subject<Image>();
        cacheImageSpy.and.returnValue(cacheImageSubject);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();

        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceImages$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(new Subject<Image[]>());

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        const image: Image = frame.state.currentImage;
        image.initializeCache(new ImageCache(undefined));
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(image, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        const fullToImage: ImageEnt = imageHelper.createImageEnt();
        fullToImage.id = "toKey";
        const toImage: Image = new Image(fullToImage);

        sequenceEdgesSubject.next({
            cached: true,
            edges: [{
                data: { direction: NavigationDirection.Next, worldMotionAzimuth: 0 },
                source: image.id,
                target: toImage.id,
            }],
        });

        cacheImageSubject.error(new Error());

        expect(cacheImageSpy.calls.count()).toBe(1);
        expect(cacheImageSpy.calls.argsFor(0)[0]).toBe(toImage.id);

        expect(appendImagesSpy.calls.count()).toBe(0);

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should cache sequence when in spatial graph mode", () => {
        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);
        // Set speed to zero so that graph mode is set to spatial when calling play
        playService.setSpeed(0);

        const cacheSequenceSpy: jasmine.Spy = spyOn(graphService, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(new Subject<Sequence>());
        const cacheSequenceImagesSpy: jasmine.Spy = spyOn(graphService, "cacheSequenceImages$");
        cacheSequenceImagesSpy.and.returnValue(new Subject<Sequence>());

        playService.play();

        const currentImage: Image = imageHelper.createImage();
        new MockCreator().mockProperty(currentImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const currentImageSubject: Subject<Image> = <Subject<Image>>stateService.currentImage$;
        currentImageSubject.next(currentImage);

        expect(cacheSequenceSpy.calls.count()).toBe(1);
        expect(cacheSequenceSpy.calls.argsFor(0)[0]).toBe(currentImage.sequenceId);

        expect(cacheSequenceImagesSpy.calls.count()).toBe(0);

        playService.stop();
    });

    it("should cache sequence images when in sequence graph mode", () => {
        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);
        // Set speed to one so that graph mode is set to sequence when calling play
        playService.setSpeed(1);

        const cacheSequenceSpy: jasmine.Spy = spyOn(graphService, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(new Subject<Sequence>());
        const cacheSequenceImagesSpy: jasmine.Spy = spyOn(graphService, "cacheSequenceImages$");
        cacheSequenceImagesSpy.and.returnValue(new Subject<Sequence>());

        playService.play();

        const currentImage: Image = imageHelper.createImage();
        new MockCreator().mockProperty(currentImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const currentImageSubject: Subject<Image> = <Subject<Image>>stateService.currentImage$;
        currentImageSubject.next(currentImage);

        expect(cacheSequenceSpy.calls.count()).toBe(0);

        expect(cacheSequenceImagesSpy.calls.count()).toBe(1);
        expect(cacheSequenceImagesSpy.calls.argsFor(0)[0]).toBe(currentImage.sequenceId);

        playService.stop();
    });

    it("should not pre-cache if current image is last sequence image", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceId";

        const currentFullImage: ImageEnt = new ImageHelper().createImageEnt();
        currentFullImage.sequence.id = sequenceKey;
        currentFullImage.id = "image0";
        const currentImage: Image = new Image(currentFullImage);
        new MockCreator().mockProperty(currentImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const prevImageKey: string = "image1";

        const currentImageSubject: Subject<Image> = <Subject<Image>>stateService.currentImage$;
        currentImageSubject.next(currentImage);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [prevImageKey, currentImage.id] });
        cacheSequenceSubject.next(sequence);

        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        const cacheImageSubject: Subject<Image> = new Subject<Image>();
        cacheImageSpy.and.returnValue(cacheImageSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentImage];
        state.lastImage = currentImage;
        state.currentImage = currentImage;
        state.imagesAhead = 0;

        (<Subject<AnimationFrame>>stateService.currentState$).next({ fps: 60, id: 0, state: state });

        expect(cacheImageSpy.calls.count()).toBe(0);

        playService.stop();
    });

    it("should pre-cache one trajectory image", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceId";

        const currentFullImage: ImageEnt = new ImageHelper().createImageEnt();
        currentFullImage.sequence.id = sequenceKey;
        currentFullImage.id = "image0";
        const currentImage: Image = new Image(currentFullImage);
        new MockCreator().mockProperty(currentImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const nextImageKey: string = "image1";

        const currentImageSubject: Subject<Image> = <Subject<Image>>stateService.currentImage$;
        currentImageSubject.next(currentImage);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [currentImage.id, nextImageKey] });
        cacheSequenceSubject.next(sequence);

        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        const cacheImageSubject: Subject<Image> = new Subject<Image>();
        cacheImageSpy.and.returnValue(cacheImageSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentImage];
        state.lastImage = currentImage;
        state.currentImage = currentImage;
        state.imagesAhead = 0;

        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        cacheImageSubject.next(new ImageHelper().createImage());

        expect(cacheImageSpy.calls.count()).toBe(1);
        expect(cacheImageSpy.calls.argsFor(0)[0]).toBe(nextImageKey);

        playService.stop();
    });

    it("should pre-cache one trajectory image in prev direction", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Prev);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceId";

        const currentFullImage: ImageEnt = new ImageHelper().createImageEnt();
        currentFullImage.sequence.id = sequenceKey;
        currentFullImage.id = "image0";
        const currentImage: Image = new Image(currentFullImage);
        new MockCreator().mockProperty(currentImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const prevImageKey: string = "image1";

        const currentImageSubject: Subject<Image> = <Subject<Image>>stateService.currentImage$;
        currentImageSubject.next(currentImage);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [prevImageKey, currentImage.id] });
        cacheSequenceSubject.next(sequence);

        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        const cacheImageSubject: Subject<Image> = new Subject<Image>();
        cacheImageSpy.and.returnValue(cacheImageSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentImage];
        state.lastImage = currentImage;
        state.currentImage = currentImage;
        state.imagesAhead = 0;

        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        cacheImageSubject.next(new ImageHelper().createImage());

        expect(cacheImageSpy.calls.count()).toBe(1);
        expect(cacheImageSpy.calls.argsFor(0)[0]).toBe(prevImageKey);

        // Sequence should not have changed because of internal reversing
        expect(sequence.imageIds[0]).toBe(prevImageKey);
        expect(sequence.imageIds[1]).toBe(currentImage.id);

        playService.stop();
    });

    it("should not pre-cache the same image twice", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceId";

        const currentFullImage: ImageEnt = new ImageHelper().createImageEnt();
        currentFullImage.sequence.id = sequenceKey;
        currentFullImage.id = "image0";
        const currentImage: Image = new Image(currentFullImage);
        currentImage.makeComplete(currentFullImage);
        new MockCreator().mockProperty(currentImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const nextImageKey: string = "image1";

        const currentImageSubject: Subject<Image> = <Subject<Image>>stateService.currentImage$;
        currentImageSubject.next(currentImage);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [currentImage.id, nextImageKey] });
        cacheSequenceSubject.next(sequence);

        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        const cacheImageSubject: Subject<Image> = new Subject<Image>();
        cacheImageSpy.and.returnValue(cacheImageSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentImage];
        state.lastImage = currentImage;
        state.currentImage = currentImage;
        state.imagesAhead = 0;

        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        const nextFullImage: ImageEnt = new ImageHelper().createImageEnt();
        nextFullImage.sequence.id = sequenceKey;
        nextFullImage.id = nextImageKey;
        const nextImage: Image = new Image(nextFullImage);
        nextImage.makeComplete(nextFullImage);
        cacheImageSubject.next(nextImage);

        expect(cacheImageSpy.calls.count()).toBe(1);
        expect(cacheImageSpy.calls.argsFor(0)[0]).toBe(nextImageKey);

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        expect(cacheImageSpy.calls.count()).toBe(1);

        playService.stop();
    });

    it("should not pre-cache if all sequence images in trajectory", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceId";

        const currentFullImage: ImageEnt = new ImageHelper().createImageEnt();
        currentFullImage.sequence.id = sequenceKey;
        currentFullImage.id = "image0";
        const currentImage: Image = new Image(currentFullImage);
        currentImage.makeComplete(currentFullImage);
        new MockCreator().mockProperty(currentImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const nextImageKey: string = "image1";
        const nextFullImage: ImageEnt = new ImageHelper().createImageEnt();
        nextFullImage.sequence.id = sequenceKey;
        nextFullImage.id = nextImageKey;
        const nextImage: Image = new Image(nextFullImage);
        nextImage.makeComplete(nextFullImage);
        new MockCreator().mockProperty(nextImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const currentImageSubject: Subject<Image> = <Subject<Image>>stateService.currentImage$;
        currentImageSubject.next(currentImage);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [currentImage.id, nextImageKey] });
        cacheSequenceSubject.next(sequence);

        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        const cacheImageSubject: Subject<Image> = new Subject<Image>();
        cacheImageSpy.and.returnValue(cacheImageSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentImage, nextImage];
        state.lastImage = nextImage;
        state.currentImage = currentImage;
        state.imagesAhead = 0;

        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        expect(cacheImageSpy.calls.count()).toBe(0);

        playService.stop();
    });

    it("should pre-cache up to specified images ahead", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);
        // Zero speed means max ten images ahead
        playService.setSpeed(0);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceId";

        const currentFullImage: ImageEnt = new ImageHelper().createImageEnt();
        currentFullImage.sequence.id = sequenceKey;
        currentFullImage.id = "currentImageKey";
        const currentImage: Image = new Image(currentFullImage);
        currentImage.makeComplete(currentFullImage);
        new MockCreator().mockProperty(currentImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [currentImage.id] });
        const sequenceImages: Image[] = [];

        for (let i: number = 0; i < 20; i++) {
            const sequenceImageKey: string = `image${i}`;
            const sequenceFullImage: ImageEnt = new ImageHelper().createImageEnt();
            sequenceFullImage.sequence.id = sequenceKey;
            sequenceFullImage.id = sequenceImageKey;
            const sequenceImage: Image = new Image(sequenceFullImage);
            sequenceImage.makeComplete(sequenceFullImage);
            new MockCreator().mockProperty(sequenceImage, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

            sequence.imageIds.push(sequenceImage.id);
            sequenceImages.push(sequenceImage);
        }

        const currentImageSubject: Subject<Image> = <Subject<Image>>stateService.currentImage$;

        currentImageSubject.next(currentImage);
        cacheSequenceSubject.next(sequence);

        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$").and.callFake(
            (key: string): Observable<Image> => {
                const fullImage: ImageEnt = new ImageHelper().createImageEnt();
                fullImage.sequence.id = sequenceKey;
                fullImage.id = key;
                const image: Image = new Image(fullImage);
                image.makeComplete(fullImage);

                return observableOf(image);
            });

        const state: IAnimationState = createState();
        state.trajectory = [currentImage];
        state.lastImage = currentImage;
        state.currentImage = currentImage;
        state.currentIndex = 0;
        state.imagesAhead = 0;

        // Cache ten images immediately
        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        let cachedCount: number = 10;
        expect(cacheImageSpy.calls.count()).toBe(cachedCount);

        // Add one image to trajectory before current image has moved
        state.trajectory = state.trajectory.concat(sequenceImages.splice(0, 1));
        state.lastImage = state.trajectory[state.trajectory.length - 1];
        state.imagesAhead = 1;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // No new images should be cached
        expect(cacheImageSpy.calls.count()).toBe(cachedCount);

        // Current image has moved one step in trajectory to the last image, images ahead
        // is zero and one new image should be cached
        state.currentIndex += 1;
        state.currentImage = state.trajectory[state.currentIndex];
        state.imagesAhead = 0;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        cachedCount += 1;
        expect(cacheImageSpy.calls.count()).toBe(cachedCount);

        // Add 5 images to trajectory and move current image 3 steps
        state.trajectory = state.trajectory.concat(sequenceImages.splice(0, 5));
        state.currentIndex += 3;
        state.currentImage = state.trajectory[state.currentIndex];
        state.lastImage = state.trajectory[state.trajectory.length - 1];
        state.imagesAhead = 2;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // Three new images should be cached
        cachedCount += 3;
        expect(cacheImageSpy.calls.count()).toBe(cachedCount);

        // Add all 14 images cached so far to trajectory and move current image to last
        // trajectory image
        state.trajectory = state.trajectory.concat(sequenceImages.splice(0, 8));
        state.currentIndex = state.trajectory.length - 1;
        expect(state.currentIndex).toBe(14);
        state.currentImage = state.trajectory[state.currentIndex];
        state.lastImage = state.trajectory[state.trajectory.length - 1];
        state.imagesAhead = 0;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // Six last images should be cached
        cachedCount += 6;
        expect(cacheImageSpy.calls.count()).toBe(cachedCount);

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // No new images should be cached
        expect(cacheImageSpy.calls.count()).toBe(cachedCount);

        // Add all remaining images to trajectory and move current image one step
        state.trajectory = state.trajectory.concat(sequenceImages.splice(0, sequenceImages.length));
        state.currentIndex += 1;
        state.currentImage = state.trajectory[state.currentIndex];
        state.lastImage = state.trajectory[state.trajectory.length - 1];
        state.imagesAhead = 5;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // No new images should be cached
        expect(cacheImageSpy.calls.count()).toBe(cachedCount);

        // Move current image to last trajectory image
        state.trajectory = state.trajectory.concat(sequenceImages.splice(0, sequenceImages.length));
        state.currentIndex = state.trajectory.length - 1;
        state.currentImage = state.trajectory[state.currentIndex];
        state.lastImage = state.trajectory[state.trajectory.length - 1];
        state.imagesAhead = 0;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // No new images should be cached
        expect(cacheImageSpy.calls.count()).toBe(20);

        for (let i: number = 0; i < 20; i++) {
            expect(cacheImageSpy.calls.argsFor(i)[0]).toBe(sequence.imageIds[i + 1]);
        }

        playService.stop();
    });
});
