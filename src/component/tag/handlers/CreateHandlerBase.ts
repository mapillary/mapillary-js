/// <reference path="../../../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {
    Component,
    Geometry,
    ITagConfiguration,
    TagCreator,
    TagHandlerBase,
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

export abstract class CreateHandlerBase extends TagHandlerBase {
    protected _tagCreator: TagCreator;

    protected _geometryCreated$: Subject<Geometry>;

    constructor(
        component: Component<ITagConfiguration>,
        container: Container,
        navigator: Navigator,
        viewportCoords: ViewportCoords,
        tagCreator: TagCreator) {
        super(component, container, navigator, viewportCoords);

        this._tagCreator = tagCreator;
        this._geometryCreated$ = new Subject<Geometry>();
    }

    public get geometryCreated$(): Observable<Geometry> {
        return this._geometryCreated$;
    }

    protected _validateBasic(basic: number[]): boolean {
        const x: number = basic[0];
        const y: number = basic[1];

        return 0 <= x && x <= 1 && 0 <= y && y <= 1;
    }

    protected _mouseEventToBasic$(mouseEvent$: Observable<MouseEvent>): Observable<number[]> {
        return mouseEvent$
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
                });
    }
}

export default CreateHandlerBase;
