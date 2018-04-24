/// <reference path="../../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import {
    Container,
} from "../../Viewer";

export class SliderDOMRenderer {
    private _container: Container;

    private _interacting: boolean;
    private _notifyPositionChanged$: Subject<number>;
    private _stopInteractionSubscription: Subscription;

    constructor(container: Container) {
        this._container = container;

        this._interacting = false;
        this._notifyPositionChanged$ = new Subject<number>();
        this._stopInteractionSubscription = null;
    }

    public get position$(): Observable<number> {
        return this._notifyPositionChanged$;
    }

    public activate(): void {
        if (!!this._stopInteractionSubscription) {
            return;
        }

        this._stopInteractionSubscription = Observable
            .merge(
                this._container.mouseService.documentMouseUp$,
                this._container.touchService.touchEnd$
                    .filter(
                        (touchEvent: TouchEvent): boolean => {
                            return touchEvent.touches.length === 0;
                        }))
            .subscribe(
                (event: Event): void => {
                    if (this._interacting) {
                        this._interacting = false;
                    }
                });
    }

    public deactivate(): void {
        if (!this._stopInteractionSubscription) {
            return;
        }

        this._interacting = false;

        this._stopInteractionSubscription.unsubscribe();
        this._stopInteractionSubscription = null;
    }

    public render(position: number): vd.VNode {
        return vd.h("div.SliderContainer", [this._createRangeInput(position)]);
    }

    private _createRangeInput(position: number): vd.VNode {
        const onChange: (e: Event) => void = (e: Event): void => {
            this._notifyPositionChanged$.next(Number((<HTMLInputElement>e.target).value) / 1000);
        };

        const onStart: (e: Event) => void = (e: Event): void => {
            this._interacting = true;
            e.stopPropagation();
        };

        const onMove: (e: Event) => void = (e: Event): void => {
            if (this._interacting) {
                e.stopPropagation();
            }
        };

        const onKeyDown: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            if (e.key === "ArrowDown" || e.key === "ArrowLeft" ||
                e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
            }
        };

        const boundingRect: ClientRect = this._container.domContainer.getBoundingClientRect();
        const width: number = Math.max(276, Math.min(410, 5 + 0.8 * boundingRect.width)) - 160;

        const rangeInput: vd.VNode = vd.h(
            "input.SliderControl",
            {
                max: 1000,
                min: 0,
                onchange: onChange,
                oninput: onChange,
                onkeydown: onKeyDown,
                onmousedown: onStart,
                onmousemove: onMove,
                ontouchmove: onMove,
                ontouchstart: onStart,
                style: {
                    width: `${width}px`,
                },
                type: "range",
                value: 1000 * position,
            },
            []);

        return rangeInput;
    }
}

export default SliderDOMRenderer;
