/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/merge";

import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/withLatestFrom";

import {
    ComponentService,
    Component,
    IMouseConfiguration,
} from "../Component";
import {Transform} from "../Geo";
import {Node} from "../Graph";
import {RenderCamera} from "../Render";
import {
    Container,
    Navigator,
    TouchMove,
    IPinch,
} from "../Viewer";

interface IMovement {
    clientX: number;
    clientY: number;
    movementX: number;
    movementY: number;
}

/**
 * @class MouseComponent
 * @classdesc Component handling mouse and touch events for camera movement.
 */
export class MouseComponent extends Component {
    /** @inheritdoc */
    public static componentName: string = "mouse";

    private _movementSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

   /**
    * Get default configuration.
    *
    * @returns {IMouseConfiguration}
    */
    public get defaultConfiguration(): IMouseConfiguration {
        return { freePerspectiveMovement: false };
    }

    protected _activate(): void {
        let mouseMovement$: Observable<IMovement> =
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

        let touchMovement$: Observable<IMovement> =
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

        this._movementSubscription = Observable
            .merge<IMovement>(
                mouseMovement$,
                touchMovement$)
            .withLatestFrom(
                this._navigator.stateService.currentNode$,
                this._configuration$,
                (m: IMovement, n: Node, c: IMouseConfiguration): [IMovement, Node, IMouseConfiguration] => {
                    return [m, n, c];
                })
            .filter(
                (args: [IMovement, Node, IMouseConfiguration]): boolean => {
                    return args[1].fullPano || args[2].freePerspectiveMovement;
                })
            .map<IMovement>(
                (args: [IMovement, Node, IMouseConfiguration]): IMovement => {
                    return args[0];
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

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let canvasX: number = m.clientX - clientRect.left;
                    let canvasY: number = m.clientY - clientRect.top;

                    let direction: THREE.Vector3 =
                        this._unproject(canvasX, canvasY, offsetWidth, offsetHeight, r.perspective)
                        .sub(r.perspective.position);

                    let directionX: THREE.Vector3 =
                        this._unproject(canvasX - m.movementX, canvasY, offsetWidth, offsetHeight, r.perspective)
                        .sub(r.perspective.position);

                    let directionY: THREE.Vector3 =
                        this._unproject(canvasX, canvasY - m.movementY, offsetWidth, offsetHeight, r.perspective)
                        .sub(r.perspective.position);

                    let phi: number = (m.movementX > 0 ? 1 : -1) * directionX.angleTo(direction);
                    let theta: number = (m.movementY > 0 ? -1 : 1) * directionY.angleTo(direction);

                    this._navigator.stateService.rotate({ phi: phi, theta: theta });
                });

        this._container.mouseService.mouseWheel$
            .withLatestFrom(
                this._navigator.stateService.currentNode$,
                this._configuration$,
                (w: WheelEvent, n: Node, c: IMouseConfiguration): [WheelEvent, Node, IMouseConfiguration] => {
                    return [w, n, c];
                })
            .filter(
                (args: [WheelEvent, Node, IMouseConfiguration]): boolean => {
                    return args[1].fullPano || args[2].freePerspectiveMovement;
                })
            .map<WheelEvent>(
                (args: [WheelEvent, Node, IMouseConfiguration]): WheelEvent => {
                    return args[0];
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                (w: WheelEvent, r: RenderCamera, t: Transform): [WheelEvent, RenderCamera, Transform] => {
                    return [w, r, t];
                })
            .subscribe(
                (wr: [WheelEvent, RenderCamera, Transform]): void => {
                    let event: WheelEvent = wr[0];
                    let render: RenderCamera = wr[1];
                    let transform: Transform = wr[2];

                    let element: HTMLElement = this._container.element;

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let canvasX: number = event.clientX - clientRect.left;
                    let canvasY: number = event.clientY - clientRect.top;

                    let unprojected: THREE.Vector3 =
                        this._unproject(canvasX, canvasY, offsetWidth, offsetHeight, render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    let zoom: number = -3 * event.deltaY / offsetHeight;

                    this._navigator.stateService.zoomIn(zoom, reference);
                });

        this._container.touchService.pinch$
            .withLatestFrom(
                this._navigator.stateService.currentNode$,
                (p: IPinch, n: Node): [IPinch, Node] => {
                    return [p, n];
                })
            .filter(
                (pn: [IPinch, Node]): boolean => {
                    return pn[1].fullPano;
                })
            .map<IPinch>(
                (pn: [IPinch, Node]): IPinch => {
                    return pn[0];
                })
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$,
                (p: IPinch, r: RenderCamera, t: Transform): [IPinch, RenderCamera, Transform] => {
                    return [p, r, t];
                })
            .subscribe(
                (prt: [IPinch, RenderCamera, Transform]): void => {
                    let pinch: IPinch = prt[0];
                    let render: RenderCamera = prt[1];
                    let transform: Transform = prt[2];

                    let element: HTMLElement = this._container.element;

                    let offsetWidth: number = element.offsetWidth;
                    let offsetHeight: number = element.offsetHeight;

                    let clientRect: ClientRect = element.getBoundingClientRect();

                    let unprojected: THREE.Vector3 =
                        this._unproject(
                            pinch.centerClientX - clientRect.left,
                            pinch.centerClientY - clientRect.top,
                            offsetWidth,
                            offsetHeight,
                            render.perspective);

                    let reference: number[] = transform.projectBasic(unprojected.toArray());

                    let zoom: number = 3 * pinch.distanceChange / Math.min(offsetHeight, offsetWidth);

                    this._navigator.stateService.zoomIn(zoom, reference);
                });

        this._container.mouseService.claimMouse(this._name, 0);
    }

    protected _deactivate(): void {
        this._container.mouseService.unclaimMouse(this._name);

        this._movementSubscription.unsubscribe();
    }

    private _unproject(
        canvasX: number,
        canvasY: number,
        offsetWidth: number,
        offsetHeight: number,
        perspectiveCamera: THREE.PerspectiveCamera):
        THREE.Vector3 {

        let projectedX: number = 2 * canvasX / offsetWidth - 1;
        let projectedY: number = 1 - 2 * canvasY / offsetHeight;

        return new THREE.Vector3(projectedX, projectedY, 1).unproject(perspectiveCamera);
    }
}

ComponentService.register(MouseComponent);
export default MouseComponent;
