/// <reference path="../../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { Subscription } from "rxjs/Subscription";

import { SliderMode } from "../../Component";
import { Container } from "../../Viewer";

export class SliderDOMRenderer {
    private _container: Container;

    private _interacting: boolean;
    private _notifyModeChanged$: Subject<SliderMode>;
    private _notifyPositionChanged$: Subject<number>;
    private _stopInteractionSubscription: Subscription;

    constructor(container: Container) {
        this._container = container;

        this._interacting = false;
        this._notifyModeChanged$ = new Subject<SliderMode>();
        this._notifyPositionChanged$ = new Subject<number>();
        this._stopInteractionSubscription = null;
    }

    public get mode$(): Observable<SliderMode> {
        return this._notifyModeChanged$;
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

    public render(position: number, mode: SliderMode, motionless: boolean, pano: boolean): vd.VNode {
        const modeButton: vd.VNode = this._createModeButton(mode, motionless, pano);
        const positionInput: vd.VNode = this._createPositionInput(position);

        return vd.h("div.SliderContainer", [modeButton, positionInput]);
    }

    private _createModeButton(mode: SliderMode, motionless: boolean, pano: boolean): vd.VNode {
        const properties: vd.createProperties = {};
        const children: vd.VNode[] = [];

        if (!(motionless || pano)) {
            properties.onclick = (): void => {
                this._notifyModeChanged$.next(
                    mode === SliderMode.Motion ?
                        SliderMode.Stationary :
                        SliderMode.Motion);
            };

            children.push(vd.h("div.SliderModeIcon", []));
        }

        const className: string = motionless ?
            "SliderModeButtonDisabled" :
            mode === SliderMode.Stationary ?
                "SliderModeButtonPressed" :
                "SliderModeButton";

        return vd.h("div." + className, properties, children);
    }

    private _createPositionInput(position: number): vd.VNode {
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
        const width: number = Math.max(276, Math.min(410, 5 + 0.8 * boundingRect.width)) - 58;

        const positionInput: vd.VNode = vd.h(
            "input.SliderPosition",
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

        return vd.h("div.SliderPositionContainer", [positionInput]);
    }
}

export default SliderDOMRenderer;
