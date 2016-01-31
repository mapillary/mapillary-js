/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />

import * as rx from "rx";
import * as _ from "underscore";

import {EdgeDirection, IEdge} from "../Edge";
import {UI} from "../UI";
import {Container, Navigator} from "../Viewer";
import {IFrame} from "../State";
import {Node} from "../Graph";

interface IKeyboardFrame {
    event: KeyboardEvent;
    frame: IFrame;
}

export class KeyboardUI extends UI {
    public static uiName: string = "keyboard";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = rx.Observable
            .fromEvent(document, "keydown")
            .withLatestFrom(
                this._navigator.stateService.currentState$,
                (event: KeyboardEvent, frame: IFrame): IKeyboardFrame => {
                    return { event: event, frame: frame };
                })
            .subscribe((kf: IKeyboardFrame): void => {
                if (!kf.frame.state.currentNode.pano) {
                    this.navigatePerspective(kf.event, kf.frame.state.currentNode);
                }
            });
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }

    private navigatePerspective(event: KeyboardEvent, node: Node): void {
        let direction: EdgeDirection = null;

        switch (event.keyCode) {
            case 37: // left
                direction = EdgeDirection.STEP_LEFT;
                break;
            case 38: // up
                direction = EdgeDirection.STEP_FORWARD;
                break;
            case 39: // right
                direction = EdgeDirection.STEP_RIGHT;
                break;
            case 40: // down
                direction = EdgeDirection.STEP_BACKWARD;
                break;
            default:
                break;
        }

        if (direction == null) {
            return;
        }

        let directionExist: boolean = _.any(
            node.edges,
            (e: IEdge): boolean => {
                return e.data.direction === direction;
            });

        if (!directionExist) {
            return;
        }

        this._navigator.moveDir(direction).subscribe();
    }
}

export default KeyboardUI;
