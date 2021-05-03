import {
    Observable,
    Subscription,
} from "rxjs";
import {
    switchMap,
    withLatestFrom,
} from "rxjs/operators";

import { Image } from "../../graph/Image";
import { NavigationEdgeStatus } from "../../graph/interfaces/NavigationEdgeStatus";
import { KeyboardConfiguration } from "../interfaces/KeyboardConfiguration";
import { HandlerBase } from "../util/HandlerBase";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { CancelMapillaryError } from "../../error/CancelMapillaryError";

/**
 * The `KeySequenceNavigationHandler` allows the user to navigate through a sequence using the
 * following key commands:
 *
 * `ALT` + `Up Arrow`: Navigate to next image in the sequence.
 * `ALT` + `Down Arrow`: Navigate to previous image in sequence.
 *
 * @example
 * ```js
 * var keyboardComponent = viewer.getComponent("keyboard");
 *
 * keyboardComponent.keySequenceNavigation.disable();
 * keyboardComponent.keySequenceNavigation.enable();
 *
 * var isEnabled = keyboardComponent.keySequenceNavigation.isEnabled;
 * ```
 */
export class KeySequenceNavigationHandler extends HandlerBase<KeyboardConfiguration> {
    private _keyDownSubscription: Subscription;

    protected _enable(): void {
        const sequenceEdges$: Observable<NavigationEdgeStatus> = this._navigator.stateService.currentImage$.pipe(
            switchMap(
                (image: Image): Observable<NavigationEdgeStatus> => {
                    return image.sequenceEdges$;
                }));

        this._keyDownSubscription = this._container.keyboardService.keyDown$.pipe(
            withLatestFrom(sequenceEdges$))
            .subscribe(
                ([event, edgeStatus]: [KeyboardEvent, NavigationEdgeStatus]): void => {
                    let direction: NavigationDirection = null;
                    switch (event.keyCode) {
                        case 38: // up
                            direction = NavigationDirection.Next;
                            break;
                        case 40: // down
                            direction = NavigationDirection.Prev;
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
                            this._navigator.moveTo$(edge.target)
                                .subscribe(
                                    undefined,
                                    (error: Error): void => {
                                        if (!(error instanceof CancelMapillaryError)) {
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

    protected _getConfiguration(enable: boolean): KeyboardConfiguration {
        return { keySequenceNavigation: enable };
    }
}
