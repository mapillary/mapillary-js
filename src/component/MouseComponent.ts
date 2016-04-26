/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {ComponentService, Component} from "../Component";
import {Transform} from "../Geo";
import {Node} from "../Graph";
import {RenderCamera} from "../Render";
import {IFrame} from "../State";
import {Container, Navigator, TouchMove} from "../Viewer";

interface IMovement {
    clientX: number;
    clientY: number;
    movementX: number;
    movementY: number;
}

export class MouseComponent extends Component {
    public static componentName: string = "mouse";

    private _currentTransform$: rx.Observable<Transform>;

    private _movementSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._currentTransform$ = this._navigator.stateService.currentState$
            .distinctUntilChanged(
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                })
            .map<Transform>(
                (frame: IFrame): Transform => {
                    return frame.state.currentTransform;
                })
            .shareReplay(1);
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
                this._navigator.stateService.currentNode$,
                (m: IMovement, n: Node): [IMovement, Node] => {
                    return [m, n];
                })
            .filter(
                (mn: [IMovement, Node]): boolean => {
                    return mn[1].fullPano;
                })
            .map<IMovement>(
                (mn: [IMovement, Node]): IMovement => {
                    return mn[0];
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                (m: IMovement, r: RenderCamera): [IMovement, RenderCamera] => {
                    return [m, r];
                })
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

        this._container.mouseService.mouseWheel$
            .withLatestFrom(
                this._navigator.stateService.currentNode$,
                (w: WheelEvent, n: Node): [WheelEvent, Node] => {
                    return [w, n];
                })
            .filter(
                (wn: [WheelEvent, Node]): boolean => {
                    return wn[1].fullPano;
                })
            .map<WheelEvent>(
                (wn: [WheelEvent, Node]): WheelEvent => {
                    return wn[0];
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._currentTransform$,
                (w: WheelEvent, r: RenderCamera, t: Transform): [WheelEvent, RenderCamera, Transform] => {
                    return [w, r, t];
                })
            .subscribe(
                (wr: [WheelEvent, RenderCamera, Transform]): void => {
                    let event: WheelEvent = wr[0];
                    let render: RenderCamera = wr[1];
                    let transform: Transform = wr[2];

                    let zoom: number = -3 * event.deltaY / this._container.element.offsetHeight;

                    let element: HTMLElement = this._container.element;

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let canvasX: number = event.clientX - element.offsetLeft;
                    let canvasY: number = event.clientY - element.offsetLeft;

                    let unprojected: THREE.Vector3 =
                        this._unproject(canvasX, canvasY, offsetWidth, offsetHeight, render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    this._navigator.stateService.zoomIn(zoom, reference);
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
