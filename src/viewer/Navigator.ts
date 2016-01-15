/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IAPISearchImClose2, APIv2} from "../API";
import {GraphService, Node} from "../Graph";
import {EdgeDirection} from "../Edge";
import {StateService} from "../State";
import {LoadingService} from "../Viewer";

export class Navigator {
    public graphService: GraphService;
    public stateService: StateService;
    public loadingService: LoadingService;

    public apiV2: APIv2;

    private currentNode: Node;

    constructor (clientId: string) {
        this.apiV2 = new APIv2(clientId);

        this.graphService = new GraphService(this.apiV2);
        this.stateService = new StateService();
        this.loadingService = new LoadingService();

        this.stateService.currentNode.subscribe((node: Node) => { this.currentNode = node; });
    }

    public moveToKey(key: string): rx.Observable<Node> {
        this.loadingService.startLoading("navigator");
        return this.graphService.getNode(key).map<Node>((node: Node) => {
            this.loadingService.stopLoading("navigator");
            this.stateService.setNodes([node]);
            return node;
        });
    }

    public moveDir(dir: EdgeDirection): rx.Observable<Node> {
        this.loadingService.startLoading("navigator");
        return this.graphService.getNextNode(this.currentNode, dir).flatMap((node: Node) => {
            return this.moveToKey(node.key);
        });
    }

    public moveCloseTo(lat: number, lon: number): rx.Observable<Node> {
        this.loadingService.startLoading("navigator");
        return rx.Observable.fromPromise(this.apiV2.search.im.close2(lat, lon)).flatMap((data: IAPISearchImClose2): rx.Observable<Node> => {
            return this.moveToKey(data.key);
        });
    }
}

export default Navigator;
