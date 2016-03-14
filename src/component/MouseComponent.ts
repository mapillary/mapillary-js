/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {ComponentService, Component} from "../Component";
import {Container, Navigator, TouchMove} from "../Viewer";

interface IMovement {
    x: number;
    y: number;
}

export class MouseComponent extends Component {
    public static componentName: string = "mouse";

    private _movementSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._container.mouseService.claimMouse(this._name, 0);

        let mouseMovement$: rx.Observable<IMovement> =
            this._container.mouseService
                .filteredMouseEvent$(this._name, this._container.mouseService.mouseDrag$)
                .map<IMovement>(
                    (a: any): IMovement => {
                        return { x: a.e.movementX, y: a.e.movementY };
                    });

        let touchMovement$: rx.Observable<IMovement> =
            this._container.touchService.singleTouchMove$
                .map<IMovement>(
                    (touch: TouchMove): IMovement => {
                        return { x: touch.movementX, y: touch.movementY };
                    });

        this._movementSubscription = rx.Observable
            .merge(
                mouseMovement$,
                touchMovement$)
            .subscribe(
                (movement: IMovement): void => {
                    let width: number = this._container.element.offsetWidth;
                    let height: number = this._container.element.offsetHeight;

                    let size: number = Math.max(width, height);

                    let w: number = Math.max(2 / 3, width / size);
                    let h: number = Math.max(2 / 3, height / size);

                    let max: number = 3 * Math.PI / 4;

                    let phi: number = w * max * movement.x / size;
                    let theta: number = -h * max * movement.y / size;

                    this._navigator.stateService.rotate({ phi: phi, theta: theta });
                });
    }

    protected _deactivate(): void {
        this._container.mouseService.unclaimMouse(this._name);

        this._movementSubscription.dispose();
    }
}

ComponentService.register(MouseComponent);
export default MouseComponent;
