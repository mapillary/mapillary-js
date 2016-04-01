/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {RenderMode, ISize} from "../Render";

export class RenderService {
    private _element: HTMLElement;

    private _resize$: rx.Subject<void>;
    private _size$: rx.BehaviorSubject<ISize>;

    private _renderMode$: rx.BehaviorSubject<RenderMode>;

    constructor(element: HTMLElement, renderMode: RenderMode) {
        this._element = element;

        this._resize$ = new rx.Subject<void>();

        this._size$ =
            new rx.BehaviorSubject<ISize>(
                {
                    height: this._element.offsetHeight,
                    width: this._element.offsetWidth,
                });

        this._renderMode$ =
            new rx.BehaviorSubject<RenderMode>(
                renderMode != null ?
                renderMode :
                RenderMode.Letterbox);

        this._resize$
            .map<ISize>(
                (): ISize => {
                    return { height: this._element.offsetHeight, width: this._element.offsetWidth };
                })
            .subscribe(this._size$);
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

    public get renderMode$(): rx.Subject<RenderMode> {
        return this._renderMode$;
    }
}

export default RenderService;
