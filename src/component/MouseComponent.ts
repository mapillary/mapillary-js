/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {ComponentService, Component} from "../Component";
import {RenderCamera} from "../Render";
import {Container, Navigator, TouchMove} from "../Viewer";

interface IMovement {
    clientX: number;
    clientY: number;
    movementX: number;
    movementY: number;
}

export class MouseComponent extends Component {
    public static componentName: string = "mouse";

    private _movementSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        let mouseMovement$: rx.Observable<IMovement> =
            this._container.mouseService
                .filtered$(this._name, this._container.mouseService.mouseDrag$)
                .map<IMovement>(
                    (e: MouseEvent): IMovement => {
                        return {
                            clientX: e.clientX,
                            clientY: e.clientY,
                            movementX: e.movementX,
                            movementY: e.movementY,
                        };
                    });

        let touchMovement$: rx.Observable<IMovement> =
            this._container.touchService.singleTouchMove$
                .map<IMovement>(
                    (touch: TouchMove): IMovement => {
                        return {
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            movementX: touch.movementX,
                            movementY: touch.movementY,
                        };
                    });

        this._movementSubscription = rx.Observable
            .merge(
                mouseMovement$,
                touchMovement$)
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                (m: IMovement, r: RenderCamera): [IMovement, RenderCamera] => {
                    return [m, r];
                }
            )
            .subscribe(
                (mr: [IMovement, RenderCamera]): void => {
                    let m: IMovement = mr[0];
                    let r: RenderCamera = mr[1];

                    let element: HTMLElement = this._container.element;

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let canvasX: number = m.clientX - element.offsetLeft;
                    let canvasY: number = m.clientY - element.offsetLeft;

                    let unprojected: THREE.Vector3 =
                        this._unproject(canvasX, canvasY, offsetWidth, offsetHeight, r.perspective);

                    let unprojectedX: THREE.Vector3 =
                        this._unproject(canvasX - m.movementX, canvasY, offsetWidth, offsetHeight, r.perspective);

                    let unprojectedY: THREE.Vector3 =
                        this._unproject(canvasX, canvasY - m.movementY, offsetWidth, offsetHeight, r.perspective);

                    let phi: number = (m.movementX > 0 ? 1 : -1) * unprojectedX.angleTo(unprojected);
                    let theta: number = (m.movementY > 0 ? -1 : 1) * unprojectedY.angleTo(unprojected);

                    this._navigator.stateService.rotate({ phi: phi, theta: theta });
                });

        this._container.mouseService.claimMouse(this._name, 0);
    }

    protected _deactivate(): void {
        this._container.mouseService.unclaimMouse(this._name);

        this._movementSubscription.dispose();
    }

    private _unproject(
        canvasX: number,
        canvasY: number,
        offsetWidth: number,
        offsetHeight: number,
        perspectiveCamera: THREE.PerspectiveCamera): THREE.Vector3 {

        let projectedX: number = 2 * canvasX / offsetWidth - 1;
        let projectedY: number = 1 - 2 * canvasY / offsetHeight;

        return new THREE.Vector3(projectedX, projectedY, 1).unproject(perspectiveCamera);
    }
}

ComponentService.register(MouseComponent);
export default MouseComponent;
