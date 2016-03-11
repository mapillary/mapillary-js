/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {GLRenderMode, ISize} from "../Render";

export class RenderService {
    private _element: HTMLElement;

    private _resize$: rx.BehaviorSubject<void>;
    private _size$: rx.Observable<ISize>;

    private _renderMode$: rx.BehaviorSubject<GLRenderMode>;

    constructor(element: HTMLElement) {
        this._element = element;

        this._resize$ = new rx.BehaviorSubject<void>(null);
        this._renderMode$ = new rx.BehaviorSubject<GLRenderMode>(GLRenderMode.Letterbox);

        this._size$ = this._resize$
            .map<ISize>(
                (): ISize => {
                    return { height: this._element.offsetHeight, width: this._element.offsetWidth };
                })
            .shareReplay(1);
    }

    public get element(): HTMLElement {
        return this._element;
    }

    public get resize$(): rx.Subject<void> {
        return this._resize$;
    }

    public get size$(): rx.Observable<ISize> {
        return this._size$;
    }

    public get renderMode$(): rx.Subject<GLRenderMode> {
        return this._renderMode$;
    }
}

export default RenderService;
