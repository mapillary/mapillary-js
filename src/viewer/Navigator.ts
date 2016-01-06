/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {IAPISearchImClose2, APIv2} from "../API";
import {GraphService, Node} from "../Graph";
import {EdgeConstants} from "../Edge";
import {StateService, StateContext} from "../State";

export class Navigator {
    public get currentNode(): Node {
        return this.state.current.node;
    }

    public graphService: GraphService;
    public stateService: StateService;
    public state: StateContext;
    public loading: boolean;

    public apiV2: APIv2;

    constructor (clientId: string) {
        this.loading = false;
        this.apiV2 = new APIv2(clientId);

        this.state = new StateContext();
        this.graphService = new GraphService(this.apiV2);
        this.stateService = new StateService();
    }

    public moveToKey(key: string): rx.Observable<Node> {
        if (this.loading) {
            return rx.Observable.throw<Node>(new Error("viewer is loading"));
        }
        this.loading = true;

        return this.graphService.getNode(key).map<Node>((node: Node): Node => {
            this.loading = false;
            this.state.move(node);
            this.stateService.startMove([node]);
            return node;
        });
    }

    public moveDir(dir: EdgeConstants.Direction): rx.Observable<Node> {
        if (this.loading) {
            return rx.Observable.throw<Node>(new Error("viewer is loading"));
        }
        return this.graphService.getNextNode(this.currentNode, dir).flatMap((node: Node) => {
            return this.moveToKey(node.key);
        });
    }

    public moveCloseTo(lat: number, lon: number): rx.Observable<Node> {
        if (this.loading) {
            return rx.Observable.throw<Node>(new Error("viewer is loading"));
        }

        return rx.Observable.fromPromise(this.apiV2.search.im.close2(lat, lon)).flatMap((data: IAPISearchImClose2): rx.Observable<Node> => {
            return this.moveToKey(data.key);
        });
    }
}

export default Navigator;
