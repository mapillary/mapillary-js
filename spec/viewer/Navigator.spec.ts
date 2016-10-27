/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";

import {
    APIv3,
    IKey,
} from "../../src/API";
import {
    Graph,
    GraphService,
    ImageLoadingService,
    Node,
} from "../../src/Graph";
import {StateService} from "../../src/State";
import {
    LoadingService,
    Navigator,
} from "../../src/Viewer";

describe("Navigator.ctor", () => {
    it("should be defined without optional params", () => {
        let navigator: Navigator = new Navigator("clientId");

        expect(navigator).toBeDefined();
    });

    it("should be defined with optional params", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        let navigator: Navigator = new Navigator(clientId, apiV3, graphService, imageLoadingService, loadingService, stateService);

        expect(navigator).toBeDefined();
    });
});

describe("Navigator.moveToKey$", () => {
    it("should start loading", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        let loadingSpy: jasmine.Spy = spyOn(loadingService, "startLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(Observable.empty<Node>());

        let navigator: Navigator = new Navigator(clientId, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let key: string = "key";

        navigator.moveToKey$(key);

        expect(loadingSpy.calls.count()).toBe(1);
        expect(loadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should stop loading when succeding", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        let stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        let key: string = "key";
        let sequenceKey: string = "sequenceKey";
        spyOn(graphService, "cacheNode$").and.returnValue(Observable.of<Node>(
            new Node({
                cl: { lat: 0, lon: 0 },
                key: key,
                l: { lat: 0, lon: 0 },
                sequence: { key: sequenceKey },
            })));

        let stateSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator = new Navigator(clientId, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.moveToKey$(key).subscribe();

        expect(stateSpy.calls.count()).toBe(1);

        expect(stopLoadingSpy.calls.count()).toBe(1);
        expect(stopLoadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should stop loading when error is thrown", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        let stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(Observable.throw<Node>(new Error()));

        let stateSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator = new Navigator(clientId, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let key: string = "key";

        navigator.moveToKey$(key)
            .subscribe(
                (n: Node): void => { return; },
                (e: Error): void => { return; });

        expect(stateSpy.calls.count()).toBe(0);

        expect(stopLoadingSpy.calls.count()).toBe(1);
        expect(stopLoadingSpy.calls.first().args[0]).toBe("navigator");
    });
});

describe("Navigator.movedToKey$", () => {
    it("should emit when move succeeds", (done) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        let key: string = "key";
        let sequenceKey: string = "sequenceKey";
        spyOn(graphService, "cacheNode$").and.returnValue(Observable.of<Node>(
            new Node({
                cl: { lat: 0, lon: 0 },
                key: key,
                l: { lat: 0, lon: 0 },
                sequence: { key: sequenceKey },
            })));

        spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator = new Navigator(clientId, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.movedToKey$
            .first()
            .subscribe(
                (k: string): void => {
                    expect(k).toBe(key);

                    done();
                });

        navigator.moveToKey$(key).subscribe();
    });
});

describe("Navigator.moveCloseTo$", () => {
    it("should start loading", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        let startLoadingSpy: jasmine.Spy = spyOn(loadingService, "startLoading").and.stub();

        spyOn(apiV3, "imageCloseTo$").and.returnValue(Observable.empty<IKey>());

        let navigator: Navigator = new Navigator(clientId, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let lat: number = 0;
        let lon: number = 0;

        navigator.moveCloseTo$(lat, lon).subscribe();

        expect(startLoadingSpy.calls.count()).toBe(1);
        expect(startLoadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should call moveToKey$ when succeding", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();

        let key: string = "key";
        spyOn(apiV3, "imageCloseTo$").and.returnValue(Observable.of<IKey>({ key: key }));

        let navigator: Navigator = new Navigator(clientId, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let moveSpy: jasmine.Spy = spyOn(navigator, "moveToKey$");
        moveSpy.and.returnValue(Observable.empty<Node>());

        let lat: number = 0;
        let lon: number = 0;

        navigator.moveCloseTo$(lat, lon).subscribe();

        expect(moveSpy.calls.count()).toBe(1);
        expect(moveSpy.calls.first().args[0]).toBe(key);
    });

    it("should stop loading and throw when failing", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        let stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        spyOn(apiV3, "imageCloseTo$").and.returnValue(Observable.of<IKey>(null));

        let navigator: Navigator = new Navigator(clientId, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let moveSpy: jasmine.Spy = spyOn(navigator, "moveToKey$");
        moveSpy.and.returnValue(Observable.empty<Node>());

        let lat: number = 0;
        let lon: number = 0;

        navigator.moveCloseTo$(lat, lon)
            .subscribe(
                (n: Node): void => { return; },
                (e: Error): void => { return; });

        expect(stopLoadingSpy.calls.count()).toBe(1);
        expect(stopLoadingSpy.calls.first().args[0]).toBe("navigator");

        expect(moveSpy.calls.count()).toBe(0);
    });
});
