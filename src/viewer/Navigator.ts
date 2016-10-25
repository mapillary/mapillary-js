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

import {
    APIv3,
    IFullNode,
    ILatLon,
} from "../API";
import {
    IEdgeStatus,
    Graph,
    GraphService,
    Node,
} from "../Graph";
import {EdgeDirection} from "../Edge";
import {StateService} from "../State";
import {LoadingService} from "../Viewer";

export class Navigator {
    public stateService: StateService;
    public loadingService: LoadingService;

    public apiV3: APIv3;

    private _newGraphService: GraphService;

    private _keyRequested$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    private _movedToKey$: Subject<string> = new Subject<string>();
    private _dirRequested$: BehaviorSubject<EdgeDirection> = new BehaviorSubject<EdgeDirection>(null);
    private _latLonRequested$: BehaviorSubject<ILatLon> = new BehaviorSubject<ILatLon>(null);

    constructor (clientId: string) {
        this.apiV3 = new APIv3(clientId);

        this._newGraphService = new GraphService(new Graph(this.apiV3));

        this.stateService = new StateService();
        this.loadingService = new LoadingService();
    }

    public get newGraphService(): GraphService {
        return this._newGraphService;
    }

    public get keyRequested$(): Observable<string> {
        return this._keyRequested$;
    }

    public get movedToKey$(): Observable<string> {
        return this._movedToKey$;
    }

    public moveToKey(key: string): Observable<Node> {
        this.loadingService.startLoading("navigator");
        this._keyRequested$.next(key);

        return this._newGraphService.cacheNode$(key)
            .do(
                (node: Node) => {
                    this.loadingService.stopLoading("navigator");
                    this.stateService.setNodes([node]);
                    this._movedToKey$.next(node.key);
                });
    }

    public moveDir(dir: EdgeDirection): Observable<Node> {
        this.loadingService.startLoading("navigator");
        this._dirRequested$.next(dir);

        return this.stateService.currentNode$
            .first()
            .mergeMap<string>(
                (node: Node): Observable<string> => {
                    return ([EdgeDirection.Next, EdgeDirection.Prev].indexOf(dir) > -1 ?
                        node.sequenceEdges$ :
                        node.spatialEdges$)
                            .first()
                            .map<string>(
                                (status: IEdgeStatus): string => {
                                    for (let edge of status.edges) {
                                        if (edge.data.direction === dir) {
                                            return edge.to;
                                        }
                                    }

                                    return null;
                                });
                })
            .mergeMap<Node>(
                (directionKey: string) => {
                    return directionKey == null ?
                        Observable.throw<Node>(
                            new Error(`Direction (${dir}) does not exist (or is not cached yet) for current node.`)) :
                        this.moveToKey(directionKey);
                });
    }

    public moveCloseTo(lat: number, lon: number): Observable<Node> {
        this.loadingService.startLoading("navigator");
        this._latLonRequested$.next({lat: lat, lon: lon});

        return this.apiV3.imageCloseTo$(lat, lon)
            .mergeMap<Node>(
                (fullNode: IFullNode): Observable<Node> => {
                    return fullNode.key == null ?
                        Observable.throw<Node>(new Error(`No image found close to lat ${lat}, lon ${lon}.`)) :
                        this.moveToKey(fullNode.key);
                });
    }
}

export default Navigator;
