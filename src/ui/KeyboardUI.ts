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
    private _perspectiveDirections: EdgeDirection[];

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._perspectiveDirections = [
            EdgeDirection.STEP_FORWARD,
            EdgeDirection.STEP_BACKWARD,
            EdgeDirection.STEP_LEFT,
            EdgeDirection.STEP_RIGHT,
            EdgeDirection.TURN_LEFT,
            EdgeDirection.TURN_RIGHT,
            EdgeDirection.TURN_U,
        ];
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
                direction = event.shiftKey ? EdgeDirection.TURN_LEFT : EdgeDirection.STEP_LEFT;
                break;
            case 38: // up
                direction = EdgeDirection.STEP_FORWARD;
                break;
            case 39: // right
                direction = event.shiftKey ? EdgeDirection.TURN_RIGHT : EdgeDirection.STEP_RIGHT;
                break;
            case 40: // down
                direction = event.shiftKey ? EdgeDirection.TURN_U : EdgeDirection.STEP_BACKWARD;
                break;
            default:
                break;
        }

        direction = this.checkExistence(direction, node);

        if (direction == null) {
            return;
        }

        this._navigator.moveDir(direction).subscribe();
    }

    private checkExistence(direction: EdgeDirection, node: Node): EdgeDirection {
        if (direction == null) {
            return null;
        }

        let directionExist: boolean = _.any(
            node.edges,
            (e: IEdge): boolean => {
                return e.data.direction === direction;
            });

        if (direction === EdgeDirection.STEP_FORWARD ||
            direction === EdgeDirection.STEP_BACKWARD) {
            if (directionExist) {
                return direction;
            } else {
                return this.fallbackToSequence(direction, node);
            }
        } else {
            return directionExist ? direction : null;
        }
    }

    private fallbackToSequence(direction: EdgeDirection, node: Node): EdgeDirection {
        let sequenceDirection: EdgeDirection = null;

        switch (direction) {
            case EdgeDirection.STEP_FORWARD:
                sequenceDirection = EdgeDirection.NEXT;
                break;
            case EdgeDirection.STEP_BACKWARD:
                sequenceDirection = EdgeDirection.PREV;
                break;
            default:
                break;
        }

        if (sequenceDirection == null) {
            return null;
        }

        let sequenceEdge: IEdge = _.find(
            node.edges,
            (e: IEdge): boolean => {
                return e.data.direction === sequenceDirection;
            });

        if (sequenceEdge == null) {
            return null;
        }

        let perspectiveEdges: IEdge[] = node.edges.filter(
            (e: IEdge): boolean => {
                return this._perspectiveDirections.indexOf(e.data.direction) > -1;
            });

        for (let edge of perspectiveEdges) {
            if (edge.to === sequenceEdge.to) {
                return null;
            }
        }

        return sequenceDirection;
    }
}

export default KeyboardUI;
