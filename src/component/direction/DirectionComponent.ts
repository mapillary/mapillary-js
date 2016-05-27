/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {
    ComponentService,
    Component,
    DirectionDOMRenderer,
    IDirectionConfiguration,
} from "../../Component";
import {Node} from "../../Graph";
import {IVNodeHash, RenderCamera} from "../../Render";
import {Container, Navigator} from "../../Viewer";

export class DirectionComponent extends Component {
    public static componentName: string = "direction";

    private _directionDOMRenderer: DirectionDOMRenderer;

    private _hoveredKey$: rx.Observable<string>;

    private _configurationSubscription: rx.IDisposable;
    private _nodeSubscription: rx.IDisposable;
    private _renderCameraSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._directionDOMRenderer = new DirectionDOMRenderer();

        this._hoveredKey$ = rx.Observable
            .combineLatest(
                this._container.domRenderer.element$,
                this._container.renderService.renderCamera$,
                this._container.mouseService.mouseMove$.startWith(null),
                this._container.mouseService.mouseUp$.startWith(null),
                (e: Element, rc: RenderCamera, mm: MouseEvent, mu: MouseEvent): Element => {
                    return e;
                })
            .map<string>(
                (element: Element): string => {
                    let hovered: Element = null;

                    let steps: NodeListOf<Element> = element.getElementsByClassName("Directions");

                    for (let i: number = 0; i < steps.length; i++) {
                        hovered = steps.item(i).querySelector(":hover");

                        if (hovered != null && hovered.hasAttribute("data-key")) {
                            return hovered.getAttribute("data-key");
                        }
                    }

                    let turns: NodeListOf<Element> = element.getElementsByClassName("DirectionsPerspective");

                    for (let i: number = 0; i < steps.length; i++) {
                        hovered = turns.item(i).querySelector(":hover");

                        if (hovered != null && hovered.hasAttribute("data-key")) {
                            return hovered.getAttribute("data-key");
                        }
                    }

                    return null;
                })
            .distinctUntilChanged()
            .shareReplay(1);
    }

    public get defaultConfiguration(): IDirectionConfiguration {
        return { offsetScale: 1 };
    }

    public get hoveredKey$(): rx.Observable<string> {
        return this._hoveredKey$;
    }

    protected _activate(): void {
        this._configurationSubscription = this._configuration$
            .subscribe(
                (configuration: IDirectionConfiguration): void => {
                    this._directionDOMRenderer.setOffsetScale(configuration.offsetScale);
                });

        this._nodeSubscription = this._navigator.stateService.currentNode$
            .do(
                (node: Node): void => {
                    this._container.domRenderer.render$.onNext({name: this._name, vnode: vd.h("div", {}, [])});
                })
            .subscribe(
                (node: Node): void => {
                    this._directionDOMRenderer.setNode(node);
                });

        this._renderCameraSubscription = this._container.renderService.renderCameraFrame$
            .do(
                (renderCamera: RenderCamera): void => {
                    this._directionDOMRenderer.setRenderCamera(renderCamera);
                })
            .map<DirectionDOMRenderer>(
                (renderCamera: RenderCamera): DirectionDOMRenderer => {
                    return this._directionDOMRenderer;
                })
            .filter(
                (renderer: DirectionDOMRenderer): boolean => {
                    return renderer.needsRender;
                })
            .map<IVNodeHash>(
                (renderer: DirectionDOMRenderer): IVNodeHash => {
                    return { name: this._name, vnode: renderer.render(this._navigator) };
                })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._configurationSubscription.dispose();
        this._nodeSubscription.dispose();
        this._renderCameraSubscription.dispose();
    }
}

ComponentService.register(DirectionComponent);
export default DirectionComponent;
