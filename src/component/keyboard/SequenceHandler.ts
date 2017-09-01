/// <reference path="../../../typings/index.d.ts" />

import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/withLatestFrom";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    IKeyboardConfiguration,
    HandlerBase,
} from "../../Component";
import {EdgeDirection} from "../../Edge";
import {
    IEdgeStatus,
    Node,
} from "../../Graph";

/**
 * The `SequenceHandler` allows the user navigate through a sequence using the
 * following key commands:
 *
 * `ALT` + `Up Arrow`: Navigate to next image in the sequence.
 * `ALT` + `Down Arrow`: Navigate to previous image in sequence.
 *
 * @example
 * ```
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.sequence.disable();
 * keyboardComponent.sequence.enable();
 *
 * var isEnabled = keyboardComponent.sequence.isEnabled;
 * ```
 */
export class SequenceHandler extends HandlerBase<IKeyboardConfiguration> {
    private _keyDownSubscription: Subscription;

    protected _enable(): void {
        const sequenceEdges$: Observable<IEdgeStatus> = this._navigator.stateService.currentNode$
            .switchMap(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.sequenceEdges$;
                });

        this._keyDownSubscription = Observable
            .fromEvent(document, "keydown")
            .withLatestFrom(sequenceEdges$)
            .subscribe(
                ([event, edgeStatus]: [KeyboardEvent, IEdgeStatus]): void => {
                    let direction: EdgeDirection = null;
                    switch (event.keyCode) {
                        case 38: // up
                            direction = EdgeDirection.Next;
                            break;
                        case 40: // down
                            direction = EdgeDirection.Prev;
                            break;
                        default:
                            return;
                    }

                    event.preventDefault();

                    if (!event.altKey || event.shiftKey || !edgeStatus.cached) {
                        return;
                    }

                    for (const edge of edgeStatus.edges) {
                        if (edge.data.direction === direction) {
                            this._navigator.moveToKey$(edge.to)
                                .subscribe(
                                    (n: Node): void => { return; },
                                    (e: Error): void => { console.error(e); });

                            return;
                        }
                    }
                });
    }

    protected _disable(): void {
        this._keyDownSubscription.unsubscribe();
    }

    protected _getConfiguration(enable: boolean): IKeyboardConfiguration {
        return { sequence: enable };
    }
}

export default SequenceHandler;
