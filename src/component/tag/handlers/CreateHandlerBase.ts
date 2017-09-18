/// <reference path="../../../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {
    Component,
    HandlerBase,
    Geometry,
    ITagConfiguration,
} from "../../../Component";
import {
    Container,
    Navigator,
} from "../../../Viewer";

export abstract class CreateHandlerBase extends HandlerBase<ITagConfiguration> {
    protected _geometryCreated$: Subject<Geometry>;
    protected _validBasicClick$: Observable<number[]>;

    constructor(
        component: Component<ITagConfiguration>,
        container: Container,
        navigator: Navigator,
        validBasicClick$: Observable<number[]>) {
        super(component, container, navigator);

        this._geometryCreated$ = new Subject<Geometry>();
        this._validBasicClick$ = validBasicClick$;
    }

    public get geometryCreated$(): Observable<Geometry> {
        return this._geometryCreated$;
    }

    protected _getConfiguration(enable: boolean): ITagConfiguration {
        return {};
    }
}

export default CreateHandlerBase;
