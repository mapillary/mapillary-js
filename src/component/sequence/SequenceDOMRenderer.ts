import { merge as observableMerge, Observable, Subject, Subscription } from "rxjs";

import { filter } from "rxjs/operators";
import * as vd from "virtual-dom";

import {
    SequenceMode,
    ISequenceConfiguration,
    SequenceComponent,
} from "../../Component";
import { EdgeDirection } from "../../Edge";
import { AbortMapillaryError } from "../../Error";
import {
    IEdgeStatus,
    Node,
} from "../../Graph";
import { ISize } from "../../Render";
import {
    Container,
    Navigator,
} from "../../Viewer";

export class SequenceDOMRenderer {
    private _container: Container;

    private _minThresholdWidth: number;
    private _maxThresholdWidth: number;
    private _minThresholdHeight: number;
    private _maxThresholdHeight: number;
    private _stepperDefaultWidth: number;
    private _controlsDefaultWidth: number;
    private _defaultHeight: number;
    private _expandControls: boolean;
    private _mode: SequenceMode;
    private _speed: number;
    private _changingSpeed: boolean;
    private _index: number;
    private _changingPosition: boolean;

    private _mouseEnterDirection$: Subject<EdgeDirection>;
    private _mouseLeaveDirection$: Subject<EdgeDirection>;
    private _notifyChanged$: Subject<SequenceDOMRenderer>;
    private _notifyChangingPositionChanged$: Subject<boolean>;
    private _notifySpeedChanged$: Subject<number>;
    private _notifyIndexChanged$: Subject<number>;

    private _changingSubscription: Subscription;

    constructor(container: Container) {
        this._container = container;

        this._minThresholdWidth = 320;
        this._maxThresholdWidth = 1480;
        this._minThresholdHeight = 240;
        this._maxThresholdHeight = 820;
        this._stepperDefaultWidth = 108;
        this._controlsDefaultWidth = 88;

        this._defaultHeight = 30;
        this._expandControls = false;
        this._mode = SequenceMode.Default;
        this._speed = 0.5;
        this._changingSpeed = false;
        this._index = null;
        this._changingPosition = false;

        this._mouseEnterDirection$ = new Subject<EdgeDirection>();
        this._mouseLeaveDirection$ = new Subject<EdgeDirection>();
        this._notifyChanged$ = new Subject<SequenceDOMRenderer>();
        this._notifyChangingPositionChanged$ = new Subject<boolean>();
        this._notifySpeedChanged$ = new Subject<number>();
        this._notifyIndexChanged$ = new Subject<number>();
    }

    public get changed$(): Observable<SequenceDOMRenderer> {
        return this._notifyChanged$;
    }

    public get changingPositionChanged$(): Observable<boolean> {
        return this._notifyChangingPositionChanged$;
    }

    public get speed$(): Observable<number> {
        return this._notifySpeedChanged$;
    }

    public get index$(): Observable<number> {
        return this._notifyIndexChanged$;
    }

    public get mouseEnterDirection$(): Observable<EdgeDirection> {
        return this._mouseEnterDirection$;
    }

    public get mouseLeaveDirection$(): Observable<EdgeDirection> {
        return this._mouseLeaveDirection$;
    }

    public activate(): void {
        if (!!this._changingSubscription) {
            return;
        }

        this._changingSubscription = observableMerge(
            this._container.mouseService.documentMouseUp$,
            this._container.touchService.touchEnd$.pipe(
                filter(
                    (touchEvent: TouchEvent): boolean => {
                        return touchEvent.touches.length === 0;
                    })))
            .subscribe(
                (event: Event): void => {
                    if (this._changingSpeed) {
                        this._changingSpeed = false;
                    }

                    if (this._changingPosition) {
                        this._setChangingPosition(false);
                    }
                });
    }

    public deactivate(): void {
        if (!this._changingSubscription) {
            return;
        }

        this._changingSpeed = false;
        this._changingPosition = false;
        this._expandControls = false;
        this._mode = SequenceMode.Default;

        this._changingSubscription.unsubscribe();
        this._changingSubscription = null;
    }

    public render(
        edgeStatus: IEdgeStatus,
        configuration: ISequenceConfiguration,
        containerWidth: number,
        speed: number,
        index: number,
        max: number,
        playEnabled: boolean,
        component: SequenceComponent,
        navigator: Navigator): vd.VNode {

        if (configuration.visible === false) {
            return vd.h("div.SequenceContainer", {}, []);
        }

        const stepper: vd.VNode =
            this._createStepper(
                edgeStatus,
                configuration,
                playEnabled,
                containerWidth,
                component,
                navigator);
        const controls: vd.VNode = this._createSequenceControls(containerWidth);
        const playback: vd.VNode = this._createPlaybackControls(containerWidth, speed, component, configuration);
        const timeline: vd.VNode = this._createTimelineControls(containerWidth, index, max);

        return vd.h("div.SequenceContainer", [stepper, controls, playback, timeline]);
    }

    public getContainerWidth(size: ISize, configuration: ISequenceConfiguration): number {
        let minWidth: number = configuration.minWidth;
        let maxWidth: number = configuration.maxWidth;
        if (maxWidth < minWidth) {
            maxWidth = minWidth;
        }

        let relativeWidth: number =
            (size.width - this._minThresholdWidth) / (this._maxThresholdWidth - this._minThresholdWidth);
        let relativeHeight: number =
            (size.height - this._minThresholdHeight) / (this._maxThresholdHeight - this._minThresholdHeight);

        let coeff: number = Math.max(0, Math.min(1, Math.min(relativeWidth, relativeHeight)));

        return minWidth + coeff * (maxWidth - minWidth);
    }

    private _createPositionInput(index: number, max: number): vd.VNode {
        this._index = index;

        const onPosition: (e: Event) => void = (e: Event): void => {
            this._index = Number((<HTMLInputElement>e.target).value);
            this._notifyIndexChanged$.next(this._index);
        };

        const boundingRect: ClientRect = this._container.domContainer.getBoundingClientRect();
        const width: number = Math.max(276, Math.min(410, 5 + 0.8 * boundingRect.width)) - 65;

        const onStart: (e: Event) => void = (e: Event): void => {
            e.stopPropagation();
            this._setChangingPosition(true);
        };

        const onMove: (e: Event) => void = (e: Event): void => {
            if (this._changingPosition === true) {
                e.stopPropagation();
            }
        };

        const onKeyDown: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            if (e.key === "ArrowDown" || e.key === "ArrowLeft" ||
                e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
            }
        };

        const positionInputProperties: vd.createProperties = {
            max: max != null ? max : 1,
            min: 0,
            onchange: onPosition,
            oninput: onPosition,
            onkeydown: onKeyDown,
            onmousedown: onStart,
            onmousemove: onMove,
            ontouchmove: onMove,
            ontouchstart: onStart,
            style: {
                width: `${width}px`,
            },
            type: "range",
            value: index != null ? index : 0,
        };

        const disabled: boolean = index == null || max == null || max <= 1;

        if (disabled) {
            positionInputProperties.disabled = "true";
        }

        const positionInput: vd.VNode = vd.h("input.SequencePosition", positionInputProperties, []);

        const positionContainerClass: string = disabled ? ".SequencePositionContainerDisabled" : ".SequencePositionContainer";

        return vd.h("div" + positionContainerClass, [positionInput]);
    }

    private _createSpeedInput(speed: number): vd.VNode {
        this._speed = speed;

        const onSpeed: (e: Event) => void = (e: Event): void => {
            this._speed = Number((<HTMLInputElement>e.target).value) / 1000;
            this._notifySpeedChanged$.next(this._speed);
        };

        const boundingRect: ClientRect = this._container.domContainer.getBoundingClientRect();
        const width: number = Math.max(276, Math.min(410, 5 + 0.8 * boundingRect.width)) - 160;

        const onStart: (e: Event) => void = (e: Event): void => {
            this._changingSpeed = true;
            e.stopPropagation();
        };

        const onMove: (e: Event) => void = (e: Event): void => {
            if (this._changingSpeed === true) {
                e.stopPropagation();
            }
        };

        const onKeyDown: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
            if (e.key === "ArrowDown" || e.key === "ArrowLeft" ||
                e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
            }
        };

        const speedInput: vd.VNode = vd.h(
            "input.SequenceSpeed",
            {
                max: 1000,
                min: 0,
                onchange: onSpeed,
                oninput: onSpeed,
                onkeydown: onKeyDown,
                onmousedown: onStart,
                onmousemove: onMove,
                ontouchmove: onMove,
                ontouchstart: onStart,
                style: {
                    width: `${width}px`,
                },
                type: "range",
                value: 1000 * speed,
            },
            []);

        return vd.h("div.SequenceSpeedContainer", [speedInput]);
    }

    private _createPlaybackControls(
        containerWidth: number,
        speed: number,
        component: SequenceComponent,
        configuration: ISequenceConfiguration): vd.VNode {

        if (this._mode !== SequenceMode.Playback) {
            return vd.h("div.SequencePlayback", []);
        }

        const switchIcon: vd.VNode = vd.h("div.SequenceSwitchIcon.SequenceIconVisible", []);
        const direction: EdgeDirection = configuration.direction === EdgeDirection.Next ?
            EdgeDirection.Prev : EdgeDirection.Next;

        const playing: boolean = configuration.playing;
        const switchButtonProperties: vd.createProperties = {
            onclick: (): void => {
                if (!playing) {
                    component.setDirection(direction);
                }
            },
        };
        const switchButtonClassName: string = configuration.playing ? ".SequenceSwitchButtonDisabled" : ".SequenceSwitchButton";
        const switchButton: vd.VNode = vd.h("div" + switchButtonClassName, switchButtonProperties, [switchIcon]);
        const slowIcon: vd.VNode = vd.h("div.SequenceSlowIcon.SequenceIconVisible", []);
        const slowContainer: vd.VNode = vd.h("div.SequenceSlowContainer", [slowIcon]);
        const fastIcon: vd.VNode = vd.h("div.SequenceFastIcon.SequenceIconVisible", []);
        const fastContainer: vd.VNode = vd.h("div.SequenceFastContainer", [fastIcon]);
        const closeIcon: vd.VNode = vd.h("div.SequenceCloseIcon.SequenceIconVisible", []);
        const closeButtonProperties: vd.createProperties = {
            onclick: (): void => {
                this._mode = SequenceMode.Default;
                this._notifyChanged$.next(this);
            },
        };
        const closeButton: vd.VNode = vd.h("div.SequenceCloseButton", closeButtonProperties, [closeIcon]);
        const speedInput: vd.VNode = this._createSpeedInput(speed);

        const playbackChildren: vd.VNode[] = [switchButton, slowContainer, speedInput, fastContainer, closeButton];

        const top: number = Math.round(containerWidth / this._stepperDefaultWidth * this._defaultHeight + 10);
        const playbackProperties: vd.createProperties = { style: { top: `${top}px` } };

        return vd.h("div.SequencePlayback", playbackProperties, playbackChildren);
    }

    private _createPlayingButton(
        nextKey: string,
        prevKey: string,
        playEnabled: boolean,
        configuration: ISequenceConfiguration,
        component: SequenceComponent): vd.VNode {

        let canPlay: boolean =
            (configuration.direction === EdgeDirection.Next && nextKey != null) ||
            (configuration.direction === EdgeDirection.Prev && prevKey != null);
        canPlay = canPlay && playEnabled;

        let onclick: (e: Event) => void = configuration.playing ?
            (e: Event): void => { component.stop(); } :
            canPlay ? (e: Event): void => { component.play(); } : null;

        let buttonProperties: vd.createProperties = { onclick: onclick };

        let iconClass: string = configuration.playing ?
            "Stop" :
            canPlay ? "Play" : "PlayDisabled";

        let iconProperties: vd.createProperties = { className: iconClass };
        if (configuration.direction === EdgeDirection.Prev) {
            iconProperties.style = {
                transform: "rotate(180deg) translate(50%, 50%)",
            };
        }

        let icon: vd.VNode = vd.h("div.SequenceComponentIcon", iconProperties, []);

        let buttonClass: string = canPlay ? "SequencePlay" : "SequencePlayDisabled";

        return vd.h("div." + buttonClass, buttonProperties, [icon]);
    }

    private _createSequenceControls(containerWidth: number): vd.VNode {
        const borderRadius: number = Math.round(8 / this._stepperDefaultWidth * containerWidth);
        const expanderProperties: vd.createProperties = {
            onclick: (): void => {
                this._expandControls = !this._expandControls;
                this._mode = SequenceMode.Default;
                this._notifyChanged$.next(this);
            },
            style: {
                "border-bottom-right-radius": `${borderRadius}px`,
                "border-top-right-radius": `${borderRadius}px`,
            },
        };
        const expanderBar: vd.VNode = vd.h("div.SequenceExpanderBar", []);
        const expander: vd.VNode = vd.h("div.SequenceExpanderButton", expanderProperties, [expanderBar]);

        const fastIconClassName: string = this._mode === SequenceMode.Playback ?
            ".SequenceFastIconGrey.SequenceIconVisible" : ".SequenceFastIcon";
        const fastIcon: vd.VNode = vd.h("div" + fastIconClassName, []);
        const playbackProperties: vd.createProperties = {
            onclick: (): void => {
                this._mode = this._mode === SequenceMode.Playback ?
                    SequenceMode.Default :
                    SequenceMode.Playback;
                this._notifyChanged$.next(this);
            },
        };

        const playback: vd.VNode = vd.h("div.SequencePlaybackButton", playbackProperties, [fastIcon]);

        const timelineIconClassName: string = this._mode === SequenceMode.Timeline ?
            ".SequenceTimelineIconGrey.SequenceIconVisible" : ".SequenceTimelineIcon";
        const timelineIcon: vd.VNode = vd.h("div" + timelineIconClassName, []);
        const timelineProperties: vd.createProperties = {
            onclick: (): void => {
                this._mode = this._mode === SequenceMode.Timeline ?
                    SequenceMode.Default :
                    SequenceMode.Timeline;
                this._notifyChanged$.next(this);
            },
        };

        const timeline: vd.VNode = vd.h("div.SequenceTimelineButton", timelineProperties, [timelineIcon]);

        const properties: vd.createProperties = {
            style: {
                height: (this._defaultHeight / this._stepperDefaultWidth * containerWidth) + "px",
                transform: `translate(${containerWidth / 2 + 2}px, 0)`,
                width: (this._controlsDefaultWidth / this._stepperDefaultWidth * containerWidth) + "px",
            },
        };

        const className: string = ".SequenceControls" +
            (this._expandControls ? ".SequenceControlsExpanded" : "");

        return vd.h("div" + className, properties, [playback, timeline, expander]);
    }

    private _createSequenceArrows(
        nextKey: string,
        prevKey: string,
        containerWidth: number,
        configuration: ISequenceConfiguration,
        navigator: Navigator): vd.VNode[] {

        let nextProperties: vd.createProperties = {
            onclick: nextKey != null ?
                (e: Event): void => {
                    navigator.moveDir$(EdgeDirection.Next)
                        .subscribe(
                            undefined,
                            (error: Error): void => {
                                if (!(error instanceof AbortMapillaryError)) {
                                    console.error(error);
                                }
                            });
                } :
                null,
            onmouseenter: (e: MouseEvent): void => { this._mouseEnterDirection$.next(EdgeDirection.Next); },
            onmouseleave: (e: MouseEvent): void => { this._mouseLeaveDirection$.next(EdgeDirection.Next); },
        };

        const borderRadius: number = Math.round(8 / this._stepperDefaultWidth * containerWidth);
        let prevProperties: vd.createProperties = {
            onclick: prevKey != null ?
                (e: Event): void => {
                    navigator.moveDir$(EdgeDirection.Prev)
                        .subscribe(
                            undefined,
                            (error: Error): void => {
                                if (!(error instanceof AbortMapillaryError)) {
                                    console.error(error);
                                }
                            });
                } :
                null,
            onmouseenter: (e: MouseEvent): void => { this._mouseEnterDirection$.next(EdgeDirection.Prev); },
            onmouseleave: (e: MouseEvent): void => { this._mouseLeaveDirection$.next(EdgeDirection.Prev); },
            style: {
                "border-bottom-left-radius": `${borderRadius}px`,
                "border-top-left-radius": `${borderRadius}px`,
            },
        };

        let nextClass: string = this._getStepClassName(EdgeDirection.Next, nextKey, configuration.highlightKey);
        let prevClass: string = this._getStepClassName(EdgeDirection.Prev, prevKey, configuration.highlightKey);

        let nextIcon: vd.VNode = vd.h("div.SequenceComponentIcon", []);
        let prevIcon: vd.VNode = vd.h("div.SequenceComponentIcon", []);

        return [
            vd.h("div." + prevClass, prevProperties, [prevIcon]),
            vd.h("div." + nextClass, nextProperties, [nextIcon]),
        ];
    }

    private _createStepper(
        edgeStatus: IEdgeStatus,
        configuration: ISequenceConfiguration,
        playEnabled: boolean,
        containerWidth: number,
        component: SequenceComponent,
        navigator: Navigator,
    ): vd.VNode {

        let nextKey: string = null;
        let prevKey: string = null;

        for (let edge of edgeStatus.edges) {
            if (edge.data.direction === EdgeDirection.Next) {
                nextKey = edge.to;
            }

            if (edge.data.direction === EdgeDirection.Prev) {
                prevKey = edge.to;
            }
        }

        const playingButton: vd.VNode = this._createPlayingButton(
            nextKey, prevKey, playEnabled, configuration, component);
        const buttons: vd.VNode[] = this._createSequenceArrows(nextKey, prevKey, containerWidth, configuration, navigator);
        buttons.splice(1, 0, playingButton);

        const containerProperties: vd.createProperties = {
            oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); },
            style: {
                height: (this._defaultHeight / this._stepperDefaultWidth * containerWidth) + "px",
                width: containerWidth + "px",
            },
        };

        return vd.h("div.SequenceStepper", containerProperties, buttons);
    }

    private _createTimelineControls(containerWidth: number, index: number, max: number): vd.VNode {
        if (this._mode !== SequenceMode.Timeline) {
            return vd.h("div.SequenceTimeline", []);
        }

        const positionInput: vd.VNode = this._createPositionInput(index, max);

        const closeIcon: vd.VNode = vd.h("div.SequenceCloseIcon.SequenceIconVisible", []);
        const closeButtonProperties: vd.createProperties = {
            onclick: (): void => {
                this._mode = SequenceMode.Default;
                this._notifyChanged$.next(this);
            },
        };

        const closeButton: vd.VNode = vd.h("div.SequenceCloseButton", closeButtonProperties, [closeIcon]);

        const top: number = Math.round(containerWidth / this._stepperDefaultWidth * this._defaultHeight + 10);
        const playbackProperties: vd.createProperties = { style: { top: `${top}px` } };

        return vd.h("div.SequenceTimeline", playbackProperties, [positionInput, closeButton]);
    }

    private _getStepClassName(direction: EdgeDirection, key: string, highlightKey: string): string {
        let className: string = direction === EdgeDirection.Next ?
            "SequenceStepNext" :
            "SequenceStepPrev";

        if (key == null) {
            className += "Disabled";
        } else {
            if (highlightKey === key) {
                className += "Highlight";
            }
        }

        return className;
    }

    private _setChangingPosition(value: boolean): void {
        this._changingPosition = value;
        this._notifyChangingPositionChanged$.next(value);
    }
}

export default SequenceDOMRenderer;
