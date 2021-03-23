import * as vd from "virtual-dom";

import {
    combineLatest as observableCombineLatest,
    Observable,
} from "rxjs";

import {
    distinctUntilChanged,
    filter,
    map,
} from "rxjs/operators";

import { Component } from "../Component";
import { ComponentConfiguration } from "../interfaces/ComponentConfiguration";

import { Node } from "../../graph/Node";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { DOM } from "../../utils/DOM";

export class ImageComponent extends Component<ComponentConfiguration> {
    public static componentName: string = "image";

    private _canvasId: string;
    private _dom: DOM;

    constructor(
        name: string,
        container: Container,
        navigator: Navigator,
        dom?: DOM) {

        super(name, container, navigator);

        this._canvasId = `${container.id}-${this._name}`;
        this._dom = !!dom ? dom : new DOM();
    }

    protected _activate(): void {
        const canvasSize$: Observable<[HTMLCanvasElement, ViewportSize]> = this._container.domRenderer.element$.pipe(
            map(
                (): HTMLCanvasElement => {
                    return <HTMLCanvasElement>this._dom.document.getElementById(this._canvasId);
                }),
            filter(
                (canvas: HTMLCanvasElement): boolean => {
                    return !!canvas;
                }),
            map(
                (canvas: HTMLCanvasElement): [HTMLCanvasElement, ViewportSize] => {
                    const adaptableDomRenderer: HTMLElement = canvas.parentElement;
                    const width: number = adaptableDomRenderer.offsetWidth;
                    const height: number = adaptableDomRenderer.offsetHeight;

                    return [canvas, { height: height, width: width }];
                }),
            distinctUntilChanged(
                (s1: ViewportSize, s2: ViewportSize): boolean => {
                    return s1.height === s2.height && s1.width === s2.width;
                },
                ([, size]: [HTMLCanvasElement, ViewportSize]): ViewportSize => {
                    return size;
                }));

        this._subscriptions.push(observableCombineLatest(
            canvasSize$,
            this._navigator.stateService.currentNode$)
            .subscribe(
                ([[canvas, size], node]: [[HTMLCanvasElement, ViewportSize], Node]): void => {
                    canvas.width = size.width;
                    canvas.height = size.height;
                    canvas
                        .getContext("2d")
                        .drawImage(node.image, 0, 0, size.width, size.height);
                }));

        this._container.domRenderer.renderAdaptive$.next({ name: this._name, vnode: vd.h(`canvas#${this._canvasId}`, []) });
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): ComponentConfiguration {
        return {};
    }
}
