/// <reference path="../../../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {
    Component,
    HandlerBase,
    Geometry,
    ITagConfiguration,
    TagCreator,
} from "../../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../../Geo";
import {RenderCamera} from "../../../Render";
import {
    Container,
    Navigator,
} from "../../../Viewer";

export abstract class CreateHandlerBase extends HandlerBase<ITagConfiguration> {
    protected _tagCreator: TagCreator;
    protected _viewportCoords: ViewportCoords;

    protected _geometryCreated$: Subject<Geometry>;

    protected _basicClick$: Observable<number[]>;
    protected _validBasicClick$: Observable<number[]>;

    constructor(
        component: Component<ITagConfiguration>,
        container: Container,
        navigator: Navigator,
        tagCreator: TagCreator,
        viewportCoords: ViewportCoords) {
        super(component, container, navigator);

        this._tagCreator = tagCreator;
        this._viewportCoords = viewportCoords;

        this._geometryCreated$ = new Subject<Geometry>();

        this._basicClick$ = this._container.mouseService.staticClick$
            .withLatestFrom(
                this._container.renderService.renderCamera$,
                this._navigator.stateService.currentTransform$)
            .map(
                ([event, camera, transform]: [MouseEvent, RenderCamera, Transform]): number[] => {
                    return this._mouseEventToBasic(
                        event,
                        this._container.element,
                        camera,
                        transform);
                })
            .share();

        this._validBasicClick$ = this._basicClick$
            .filter(
                (basic: number[]): boolean => {
                    let x: number = basic[0];
                    let y: number = basic[1];

                    return 0 <= x && x <= 1 && 0 <= y && y <= 1;
                })
            .share();
    }

    public get geometryCreated$(): Observable<Geometry> {
        return this._geometryCreated$;
    }

    protected _getConfiguration(enable: boolean): ITagConfiguration {
        return {};
    }

    protected _mouseEventToBasic(
        event: MouseEvent,
        element: HTMLElement,
        camera: RenderCamera,
        transform: Transform,
        offsetX?: number,
        offsetY?: number):
        number[] {

        offsetX = offsetX != null ? offsetX : 0;
        offsetY = offsetY != null ? offsetY : 0;

        const [canvasX, canvasY]: number[] = this._viewportCoords.canvasPosition(event, element);
        const basic: number[] =
            this._viewportCoords.canvasToBasic(
                canvasX - offsetX,
                canvasY - offsetY,
                element,
                transform,
                camera.perspective);

        return basic;
    }
}

export default CreateHandlerBase;
