import {withLatestFrom, switchMap} from "rxjs/operators";
import {Observable, Subscription} from "rxjs";

import {
    IKeyboardConfiguration,
    HandlerBase,
} from "../../Component";
import {EdgeDirection} from "../../Edge";
import {AbortMapillaryError} from "../../Error";
import {
    IEdgeStatus,
    Node,
} from "../../Graph";

/**
 * The `KeySequenceNavigationHandler` allows the user to navigate through a sequence using the
 * following key commands:
 *
 * `ALT` + `Up Arrow`: Navigate to next image in the sequence.
 * `ALT` + `Down Arrow`: Navigate to previous image in sequence.
 *
 * @example
 * ```
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keySequenceNavigation.disable();
 * keyboardComponent.keySequenceNavigation.enable();
 *
 * var isEnabled = keyboardComponent.keySequenceNavigation.isEnabled;
 * ```
 */
export class KeySequenceNavigationHandler extends HandlerBase<IKeyboardConfiguration> {
    private _keyDownSubscription: Subscription;

    protected _enable(): void {
        const sequenceEdges$: Observable<IEdgeStatus> = this._navigator.stateService.currentNode$.pipe(
            switchMap(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.sequenceEdges$;
                }));

        this._keyDownSubscription = this._container.keyboardService.keyDown$.pipe(
            withLatestFrom(sequenceEdges$))
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
                                    undefined,
                                    (error: Error): void => {
                                        if (!(error instanceof AbortMapillaryError)) {
                                            console.error(error);
                                        }
                                    });

                            return;
                        }
                    }
                });
    }

    protected _disable(): void {
        this._keyDownSubscription.unsubscribe();
    }

    protected _getConfiguration(enable: boolean): IKeyboardConfiguration {
        return { keySequenceNavigation: enable };
    }
}

export default KeySequenceNavigationHandler;
