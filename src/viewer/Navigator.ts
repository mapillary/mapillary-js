/// <reference path="../../typings/index.d.ts" />

import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/fromPromise";
import "rxjs/add/observable/of";
import "rxjs/add/observable/throw";

import "rxjs/add/operator/first";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

import {IAPISearchImClose2, APIv2, APIv3} from "../API";
import {ILatLon} from "../Geo";
import {GraphService, NewGraph, NewGraphService, Node} from "../Graph";
import {EdgeDirection} from "../Edge";
import {StateService} from "../State";
import {LoadingService} from "../Viewer";

export class Navigator {
    public graphService: GraphService;
    public stateService: StateService;
    public loadingService: LoadingService;

    public apiV2: APIv2;
    public apiV3: APIv3;

    private _newGraphService: NewGraphService;

    private _keyRequested$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    private _movedToKey$: Subject<string> = new Subject<string>();
    private _dirRequested$: BehaviorSubject<EdgeDirection> = new BehaviorSubject<EdgeDirection>(null);
    private _latLonRequested$: BehaviorSubject<ILatLon> = new BehaviorSubject<ILatLon>(null);

    constructor (clientId: string) {
        this.apiV2 = new APIv2(clientId);
        this.apiV3 = new APIv3(clientId);

        this.graphService = new GraphService(this.apiV2, this.apiV3);
        this._newGraphService = new NewGraphService(new NewGraph(this.apiV3));
        this.stateService = new StateService();
        this.loadingService = new LoadingService();
    }

    public get newGraphService(): NewGraphService {
        return this._newGraphService;
    }

    public get keyRequested$(): Observable<string> {
        return this._keyRequested$;
    }

    public get movedToKey$(): Observable<string> {
        return this._movedToKey$;
    }

    public auth(token: string, projectKey?: string): void {
        this.apiV2.auth(token, projectKey);
    }

    public moveToKey(key: string): Observable<Node> {
        this.loadingService.startLoading("navigator");
        this._keyRequested$.next(key);
        return this.graphService.node$(key)
            .map<Node>(
                (node: Node) => {
                    this.loadingService.stopLoading("navigator");
                    this.stateService.setNodes([node]);
                    this._movedToKey$.next(node.key);
                    return node;
                })
            .first();
    }

    public moveDir(dir: EdgeDirection): Observable<Node> {
        this.loadingService.startLoading("navigator");
        this._dirRequested$.next(dir);
        return this.stateService.currentNode$
            .first()
            .mergeMap<Node>((currentNode: Node) => {
                return this.graphService.nextNode$(currentNode, dir)
                    .mergeMap<Node>((node: Node) => {
                        return node == null ?
                            Observable.of<Node>(null) :
                            this.moveToKey(node.key);
                    });
            })
            .first();
    }

    public moveCloseTo(lat: number, lon: number): Observable<Node> {
        this.loadingService.startLoading("navigator");
        this._latLonRequested$.next({lat: lat, lon: lon});
        return Observable
            .fromPromise(this.apiV2.search.im.close2(lat, lon))
            .mergeMap<Node>(
                (data: IAPISearchImClose2): Observable<Node> => {
                    return data.key == null ?
                        Observable.throw<Node>(new Error("no Image found")) :
                        this.moveToKey(data.key);
                })
            .first();
    }
}

export default Navigator;
