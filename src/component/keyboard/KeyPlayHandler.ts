import {
    distinctUntilChanged,
    map,
    switchMap,
    withLatestFrom,
} from "rxjs/operators";
import { Observable, Subscription } from "rxjs";

import {
    IKeyboardConfiguration,
    HandlerBase,
} from "../../Component";
import { EdgeDirection } from "../../Edge";
import {
    IEdgeStatus,
    Node,
} from "../../Graph";
import State from "../../state/State";

/**
 * The `KeyPlayHandler` allows the user to control the play behavior
 * using the following key commands:
 *
 * `Spacebar`: Start or stop playing.
 * `SHIFT` + `D`: Switch direction.
 * `<`: Decrease speed.
 * `>`: Increase speed.
 *
 * @example
 * ```
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keyPlay.disable();
 * keyboardComponent.keyPlay.enable();
 *
 * var isEnabled = keyboardComponent.keyPlay.isEnabled;
 * ```
 */
export class KeyPlayHandler extends HandlerBase<IKeyboardConfiguration> {
    private _keyDownSubscription: Subscription;

    protected _enable(): void {
        this._keyDownSubscription = this._container.keyboardService.keyDown$.pipe(
            withLatestFrom(
                this._navigator.playService.playing$,
                this._navigator.playService.direction$,
                this._navigator.playService.speed$,
                this._navigator.stateService.currentNode$.pipe(
                    switchMap(
                        (node: Node): Observable<IEdgeStatus> => {
                            return node.sequenceEdges$;
                        })),
                this._navigator.stateService.state$.pipe(
                    map(
                        (state: State): boolean => {
                            return state === State.Earth;
                        }),
                    distinctUntilChanged())))
            .subscribe(
                (
                    [event, playing, direction, speed, status, earth]:
                        [KeyboardEvent, boolean, EdgeDirection, number, IEdgeStatus, boolean]): void => {

                    if (event.altKey || event.ctrlKey || event.metaKey) {
                        return;
                    }

                    switch (event.key) {
                        case "D":
                            if (!event.shiftKey) {
                                return;
                            }

                            const newDirection: EdgeDirection = playing ?
                                null : direction === EdgeDirection.Next ?
                                    EdgeDirection.Prev : direction === EdgeDirection.Prev ?
                                        EdgeDirection.Next : null;

                            if (newDirection != null) {
                                this._navigator.playService.setDirection(newDirection);
                            }

                            break;
                        case " ":
                            if (event.shiftKey) {
                                return;
                            }

                            if (!earth) {
                                if (playing) {
                                    this._navigator.playService.stop();
                                } else {
                                    for (let edge of status.edges) {
                                        if (edge.data.direction === direction) {
                                            this._navigator.playService.play();
                                        }
                                    }
                                }
                            }

                            break;
                        case "<":
                            this._navigator.playService.setSpeed(speed - 0.05);
                            break;
                        case ">":
                            this._navigator.playService.setSpeed(speed + 0.05);
                            break;
                        default:
                            return;
                    }

                    event.preventDefault();
                });
    }

    protected _disable(): void {
        this._keyDownSubscription.unsubscribe();
    }

    protected _getConfiguration(enable: boolean): IKeyboardConfiguration {
        return { keyZoom: enable };
    }
}

export default KeyPlayHandler;
