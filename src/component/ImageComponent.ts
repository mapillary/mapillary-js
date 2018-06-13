import {combineLatest as observableCombineLatest, Observable, Subscription} from "rxjs";

import {distinctUntilChanged, filter, map} from "rxjs/operators";
import * as vd from "virtual-dom";

import {ComponentService, Component, IComponentConfiguration} from "../Component";
import {Node} from "../Graph";
import {ISize} from "../Render";
import {DOM} from "../Utils";
import {Container, Navigator} from "../Viewer";

export class ImageComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "image";

    private _canvasId: string;
    private _dom: DOM;
    private drawSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator, dom?: DOM) {
        super(name, container, navigator);

        this._canvasId = `${container.id}-${this._name}`;
        this._dom = !!dom ? dom : new DOM();
    }

    protected _activate(): void {
        const canvasSize$: Observable<[HTMLCanvasElement, ISize]> = this._container.domRenderer.element$.pipe(
            map(
                (element: HTMLElement): HTMLCanvasElement => {
                    return <HTMLCanvasElement>this._dom.document.getElementById(this._canvasId);
                }),
            filter(
                (canvas: HTMLCanvasElement): boolean => {
                    return !!canvas;
                }),
            map(
                (canvas: HTMLCanvasElement): [HTMLCanvasElement, ISize] => {
                    const adaptableDomRenderer: HTMLElement = canvas.parentElement;
                    const width: number = adaptableDomRenderer.offsetWidth;
                    const height: number = adaptableDomRenderer.offsetHeight;

                    return [canvas, { height: height, width: width }];
                }),
            distinctUntilChanged(
                (s1: ISize, s2: ISize): boolean => {
                    return s1.height === s2.height && s1.width === s2.width;
                },
                ([canvas, size]: [HTMLCanvasElement, ISize]): ISize => {
                    return size;
                }));

        this.drawSubscription = observableCombineLatest(
                canvasSize$,
                this._navigator.stateService.currentNode$)
            .subscribe(
                ([[canvas, size], node]: [[HTMLCanvasElement, ISize], Node]): void => {
                    canvas.width = size.width;
                    canvas.height = size.height;
                    canvas
                        .getContext("2d")
                        .drawImage(node.image, 0, 0, size.width, size.height);
                });

        this._container.domRenderer.renderAdaptive$.next({name: this._name, vnode: vd.h(`canvas#${this._canvasId}`, [])});
    }

    protected _deactivate(): void {
        this.drawSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }
}

ComponentService.register(ImageComponent);
export default ImageComponent;
