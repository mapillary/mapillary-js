import { bootstrap } from "../Bootstrap";
bootstrap();

import { of as observableOf, Subject } from "rxjs";

import { ImageHelper } from "../helper/ImageHelper";

import { Image } from "../../src/graph/Image";
import { APIWrapper } from "../../src/api/APIWrapper";
import { Graph } from "../../src/graph/Graph";
import { GraphMode } from "../../src/graph/GraphMode";
import { GraphService } from "../../src/graph/GraphService";
import { IAnimationState } from "../../src/state/interfaces/IAnimationState";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { State } from "../../src/state/State";
import { StateService } from "../../src/state/StateService";
import { CacheService } from "../../src/viewer/CacheService";
import { DataProvider } from "../helper/ProviderHelper";

describe("CacheService.ctor", () => {
    it("should be defined when constructed", () => {
        const api = new APIWrapper(new DataProvider());
        const graphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const cacheService = new CacheService(graphService, stateService, api);

        expect(cacheService).toBeDefined();
    });
});

describe("CacheService.configure", () => {
    it("should configure without errors", () => {
        const api = new APIWrapper(new DataProvider());
        const graphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const cacheService = new CacheService(graphService, stateService, api);

        expect(() => { cacheService.configure(); }).not.toThrow();
        expect(() => { cacheService.configure({ cellDepth: 5 }); })
            .not.toThrow();
    });
});

describe("CacheService.started", () => {
    it("should not be started", () => {
        const api = new APIWrapper(new DataProvider());
        const graphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const cacheService = new CacheService(graphService, stateService, api);

        expect(cacheService.started).toBe(false);
    });

    it("should be started after calling start", () => {
        const api = new APIWrapper(new DataProvider());
        const graphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const cacheService = new CacheService(graphService, stateService, api);

        cacheService.start();

        expect(cacheService.started).toBe(true);
    });

    it("should not be started after calling stop", () => {
        const api = new APIWrapper(new DataProvider());
        const graphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService(State.Traversing);

        const cacheService = new CacheService(graphService, stateService, api);

        cacheService.start();
        cacheService.stop();

        expect(cacheService.started).toBe(false);
    });
});

class TestStateService extends StateService {
    private _overridingCurrentState$: Subject<AnimationFrame>;

    constructor(currentState$: Subject<AnimationFrame>) {
        super(State.Traversing);

        this._overridingCurrentState$ = currentState$;
    }

    public get currentState$(): Subject<AnimationFrame> {
        return this._overridingCurrentState$;
    }
}

const createState: () => IAnimationState = (): IAnimationState => {
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
        previousImage: null,
        previousTransform: null,
        reference: null,
        state: State.Traversing,
        trajectory: null,
        zoom: 0,
    };
};

describe("CacheService.start", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should call graph service uncache method", () => {
        const api = new APIWrapper(new DataProvider());
        const graph = new Graph(api);
        const graphService = new GraphService(graph);
        graphService.setGraphMode(GraphMode.Spatial);

        spyOn(graph.api.data.geometry, "lngLatToCellId")
            .and.returnValue("cell-id");
        spyOn(graph.api.data.geometry, "getAdjacent")
            .and.returnValue(["cell-id", "adjacend-id"]);

        const currentStateSubject$ = new Subject<AnimationFrame>();
        const stateService = new TestStateService(currentStateSubject$);

        const uncacheSpy = spyOn(graphService, "uncache$");
        const uncacheSubject = new Subject<Graph>();
        uncacheSpy.and.returnValue(uncacheSubject);

        const cacheService = new CacheService(graphService, stateService, api);

        cacheService.start();

        const coreImage1 = helper.createCoreImageEnt();
        coreImage1.id = "image1";
        const image1 = new Image(coreImage1);

        const coreImage2 = helper.createCoreImageEnt();
        coreImage2.id = "image2";
        const image2 = new Image(coreImage2);

        const state = createState();
        state.trajectory = [image1, image2];
        state.currentImage = image1;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });
        currentStateSubject$.complete();

        uncacheSubject.complete();

        expect(uncacheSpy.calls.count()).toBe(1);
        expect(uncacheSpy.calls.first().args.length).toBe(3);
        expect(uncacheSpy.calls.first().args[0].length).toBe(2);
        expect(uncacheSpy.calls.first().args[0][0]).toBe(coreImage1.id);
        expect(uncacheSpy.calls.first().args[0][1]).toBe(coreImage2.id);
        expect(uncacheSpy.calls.first().args[1].length).toBe(2);
        expect(uncacheSpy.calls.first().args[2]).toBeUndefined();
    });

    it("should call graph service uncache method with sequence key of last trajectory image", () => {
        const api = new APIWrapper(new DataProvider());
        const graph = new Graph(api);
        const graphService = new GraphService(graph);
        graphService.setGraphMode(GraphMode.Sequence);

        spyOn(graph.api.data.geometry, "lngLatToCellId")
            .and.returnValue("cell-id");
        spyOn(graph.api.data.geometry, "getAdjacent")
            .and.returnValue(["cell-id", "adjacent-id"]);

        const currentStateSubject$ = new Subject<AnimationFrame>();
        const stateService = new TestStateService(currentStateSubject$);

        const uncacheSpy = spyOn(graphService, "uncache$");
        const uncacheSubject = new Subject<Graph>();
        uncacheSpy.and.returnValue(uncacheSubject);

        const cacheService = new CacheService(graphService, stateService, api);

        cacheService.start();

        const coreImage1 = helper.createCoreImageEnt();
        coreImage1.id = "image1";
        const image1 = new Image(coreImage1);

        const coreImage2 = helper.createCoreImageEnt();
        coreImage2.id = "image2";
        coreImage2.sequence.id = "sequence2";
        const image2 = new Image(coreImage2);

        const state = createState();
        state.trajectory = [image1, image2];
        state.currentImage = image1;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });
        currentStateSubject$.complete();

        uncacheSubject.complete();

        expect(uncacheSpy.calls.count()).toBe(1);
        expect(uncacheSpy.calls.first().args.length).toBe(3);
        expect(uncacheSpy.calls.first().args[0].length).toBe(2);
        expect(uncacheSpy.calls.first().args[0][0]).toBe(coreImage1.id);
        expect(uncacheSpy.calls.first().args[0][1]).toBe(coreImage2.id);
        expect(uncacheSpy.calls.first().args[1].length).toBe(2);
        expect(uncacheSpy.calls.first().args[2]).toBe(coreImage2.sequence.id);
    });

    it("should cache current image if switching to sequence graph mode", () => {
        const api = new APIWrapper(new DataProvider());
        const graph = new Graph(api);
        const graphService = new GraphService(graph);

        spyOn(graphService, "uncache$").and.returnValue(observableOf<void>(null));

        graphService.setGraphMode(GraphMode.Spatial);

        const currentStateSubject$ = new Subject<AnimationFrame>();
        const stateService = new TestStateService(currentStateSubject$);

        const cacheImageSpy = spyOn(graphService, "cacheImage$");
        const cacheImageSubject = new Subject<Graph>();
        cacheImageSpy.and.returnValue(cacheImageSubject);

        const cacheService = new CacheService(graphService, stateService, api);

        cacheService.start();

        const coreImage1 = helper.createCoreImageEnt();
        coreImage1.id = "image1";
        const image1 = new Image(coreImage1);

        const coreImage2 = helper.createCoreImageEnt();
        coreImage2.id = "image2";
        const image2 = new Image(coreImage2);

        const state = createState();
        state.trajectory = [image1, image2];
        state.currentImage = image1;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        graphService.setGraphMode(GraphMode.Sequence);

        expect(cacheImageSpy.calls.count()).toBe(1);
        expect(cacheImageSpy.calls.first().args.length).toBe(1);
        expect(cacheImageSpy.calls.first().args[0]).toBe(coreImage1.id);

        cacheService.stop();
    });

    it("should cache all trajectory images ahead if switching to spatial graph mode", () => {
        const api = new APIWrapper(new DataProvider());
        const graph = new Graph(api);
        const graphService = new GraphService(graph);

        spyOn(graphService, "uncache$").and.returnValue(observableOf<void>(null));

        graphService.setGraphMode(GraphMode.Sequence);

        const currentStateSubject$ = new Subject<AnimationFrame>();
        const stateService = new TestStateService(currentStateSubject$);

        const cacheImageSpy = spyOn(graphService, "cacheImage$");
        const cacheImageSubject = new Subject<Graph>();
        cacheImageSpy.and.returnValue(cacheImageSubject);

        const cacheService = new CacheService(graphService, stateService, api);

        cacheService.start();

        const coreImage1 = helper.createCoreImageEnt();
        coreImage1.id = "image1";
        const image1 = new Image(coreImage1);

        const coreImage2 = helper.createCoreImageEnt();
        coreImage2.id = "image2";
        const image2 = new Image(coreImage2);

        const coreImage3 = helper.createCoreImageEnt();
        coreImage3.id = "image3";
        const image3 = new Image(coreImage3);

        const state = createState();
        state.trajectory = [image1, image2, image3];
        state.currentImage = image2;
        state.currentIndex = 1;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        graphService.setGraphMode(GraphMode.Spatial);

        expect(cacheImageSpy.calls.count()).toBe(2);
        expect(cacheImageSpy.calls.first().args.length).toBe(1);
        expect(cacheImageSpy.calls.first().args[0]).toBe(coreImage2.id);
        expect(cacheImageSpy.calls.argsFor(1).length).toBe(1);
        expect(cacheImageSpy.calls.argsFor(1)[0]).toBe(coreImage3.id);

        cacheService.stop();
    });

    it("should keep the subscription open if caching a image fails", () => {
        spyOn(console, "error").and.stub();

        const api = new APIWrapper(new DataProvider());
        const graph = new Graph(api);
        const graphService = new GraphService(graph);

        spyOn(graphService, "uncache$").and.returnValue(observableOf<void>(null));

        const currentStateSubject$ = new Subject<AnimationFrame>();
        const stateService = new TestStateService(currentStateSubject$);

        const cacheImageSpy = spyOn(graphService, "cacheImage$");

        const cacheService = new CacheService(graphService, stateService, api);

        cacheService.start();

        const coreImage1 = helper.createCoreImageEnt();
        coreImage1.id = "image1";
        const image1 = new Image(coreImage1);

        const state = createState();
        state.trajectory = [image1];
        state.currentImage = image1;
        state.currentIndex = 0;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        const cacheImageSubject1 = new Subject<Graph>();
        cacheImageSpy.and.returnValue(cacheImageSubject1);

        graphService.setGraphMode(GraphMode.Sequence);

        cacheImageSubject1.error(new Error());

        const cacheImageSubject2 = new Subject<Graph>();
        cacheImageSpy.and.returnValue(cacheImageSubject2);

        graphService.setGraphMode(GraphMode.Spatial);

        expect(cacheImageSpy.calls.count()).toBe(2);

        cacheService.stop();
    });
});
