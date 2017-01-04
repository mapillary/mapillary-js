import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/operator/bufferCount";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/map";
import "rxjs/add/operator/switchMap";

import {
    Graph,
    GraphService,
    Node,
} from "../Graph";
import {
    IFrame,
    StateService,
} from "../State";

export class CacheService {
    private _graphService: GraphService;
    private _stateService: StateService;

    private _started: boolean;

    private _uncacheSubscription: Subscription;

    constructor(graphService: GraphService, stateService: StateService) {
        this._graphService = graphService;
        this._stateService = stateService;

        this._started = false;
    }

    public get started(): boolean {
        return this._started;
    }

    public start(): void {
        if (this._started) {
            return;
        }

        this._uncacheSubscription = this._stateService.currentState$
            .distinctUntilChanged(
                undefined,
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                })
            .map(
                (frame: IFrame): string[] => {
                    return frame.state.trajectory
                        .map(
                            (n: Node): string => {
                                return n.key;
                            });
                })
            .bufferCount(1, 5)
            .switchMap(
                (keepKeysBuffer: string[][]): Observable<Graph> => {
                    let keepKeys: string[] = keepKeysBuffer[0];

                    return this._graphService.uncache$(keepKeys);
                })
            .subscribe(() => { /*noop*/ });

        this._started = true;
    }

    public stop(): void {
        if (!this._started) {
            return;
        }

        this._uncacheSubscription.unsubscribe();
        this._uncacheSubscription = null;

        this._started = false;
    }
}

export default CacheService;
