/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IAPISearchImClose2, APIv2} from "../API";
import {ILatLon, GraphService, Node} from "../Graph";
import {EdgeDirection} from "../Edge";
import {StateService} from "../State";
import {LoadingService} from "../Viewer";

export class Navigator {
    public graphService: GraphService;
    public stateService: StateService;
    public loadingService: LoadingService;

    public apiV2: APIv2;

    private _keyRequested$: rx.BehaviorSubject<string> = new rx.BehaviorSubject<string>(null);
    private _dirRequested$: rx.BehaviorSubject<EdgeDirection> = new rx.BehaviorSubject<EdgeDirection>(null);
    private _latLonRequested$: rx.BehaviorSubject<ILatLon> = new rx.BehaviorSubject<ILatLon>(null);

    constructor (clientId: string) {
        this.apiV2 = new APIv2(clientId);

        this.graphService = new GraphService(this.apiV2);
        this.stateService = new StateService();
        this.loadingService = new LoadingService();
    }

    public moveToKey(key: string): rx.Observable<Node> {
        this.loadingService.startLoading("navigator");
        this._keyRequested$.onNext(key);
        return this.graphService.node$(key)
            .map<Node>((node: Node) => {
                this.loadingService.stopLoading("navigator");
                this.stateService.setNodes([node]);
                return node;
            })
            .first();
    }

    public moveDir(dir: EdgeDirection): rx.Observable<Node> {
        this.loadingService.startLoading("navigator");
        this._dirRequested$.onNext(dir);
        return this.stateService.currentNode$
            .first()
            .flatMap<Node>((currentNode: Node) => {
                return this.graphService.nextNode$(currentNode, dir)
                    .flatMap<Node>((node: Node) => {
                        return node == null ?
                            rx.Observable.just<Node>(null) :
                            this.moveToKey(node.key);
                    });
            })
            .first();
    }

    public moveCloseTo(lat: number, lon: number): rx.Observable<Node> {
        this.loadingService.startLoading("navigator");
        this._latLonRequested$.onNext({lat: lat, lon: lon});
        return rx.Observable
            .fromPromise(this.apiV2.search.im.close2(lat, lon))
            .flatMap<Node>((data: IAPISearchImClose2): rx.Observable<Node> => {
                return data.key == null ?
                    <rx.Observable<Node>> rx.Observable.throw(new Error("no Image found")) :
                    this.moveToKey(data.key);
            })
            .first();
    }

    public get keyRequested$(): rx.Observable<string> {
        return this._keyRequested$;
    }
}

export default Navigator;
