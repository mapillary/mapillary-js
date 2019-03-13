import {merge as observableMerge,  Observable ,  Subject ,  Subscription } from "rxjs";

import {filter} from "rxjs/operators";
import * as vd from "virtual-dom";

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

        this._stopInteractionSubscription = observableMerge(
                this._container.mouseService.documentMouseUp$,
                this._container.touchService.touchEnd$.pipe(
                    filter(
                        (touchEvent: TouchEvent): boolean => {
                            return touchEvent.touches.length === 0;
                        })))
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

    public render(position: number, mode: SliderMode, motionless: boolean, pano: boolean, visible: boolean): vd.VNode {
        const children: vd.VNode[] = [];

        if (visible) {
            children.push(vd.h("div.SliderBorder", []));

            const modeVisible: boolean = !(motionless || pano);
            if (modeVisible) {
                children.push(this._createModeButton(mode));
                children.push(this._createModeButton2d(mode));
            }

            children.push(this._createPositionInput(position, modeVisible));
        }

        const boundingRect: ClientRect = this._container.domContainer.getBoundingClientRect();
        const width: number = Math.max(215, Math.min(400, boundingRect.width - 100));

        return vd.h("div.SliderContainer", { style: { width: `${width}px` } }, children);
    }

    private _createModeButton(mode: SliderMode): vd.VNode {
        const properties: vd.createProperties = {
            onclick: (): void => {
                if (mode === SliderMode.Motion) {
                    return;
                }

                this._notifyModeChanged$.next(SliderMode.Motion);
            },
        };

        const className: string = mode === SliderMode.Stationary ?
            "SliderModeButtonDisabled" :
            "SliderModeButton";

        return vd.h("div." + className, properties, [vd.h("div.SliderModeIcon", [])]);
    }

    private _createModeButton2d(mode: SliderMode): vd.VNode {
        const properties: vd.createProperties = {
            onclick: (): void => {
                if (mode === SliderMode.Stationary) {
                    return;
                }

                this._notifyModeChanged$.next(SliderMode.Stationary);
            },
        };

        const className: string = mode === SliderMode.Motion ?
            "SliderModeButton2dDisabled" :
            "SliderModeButton2d";

        return vd.h("div." + className, properties, [vd.h("div.SliderModeIcon2d", [])]);
    }

    private _createPositionInput(position: number, modeVisible: boolean): vd.VNode {
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
        const width: number = Math.max(215, Math.min(400, boundingRect.width - 105)) - 84 + (modeVisible ? 0 : 52);

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
