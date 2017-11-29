/// <reference path="../../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {
    ControlMode,
    ISequenceConfiguration,
    SequenceComponent,
    SequenceDOMInteraction,
} from "../../Component";
import {EdgeDirection} from "../../Edge";
import {
    IEdgeStatus,
    Node,
} from "../../Graph";
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
    private _mode: ControlMode;
    private _speed: number;
    private _changingSpeed: boolean;

    private _notifyChanged$: Subject<SequenceDOMRenderer>;
    private _notifySpeedChanged$: Subject<number>;

    constructor(container: Container) {
        this._container = container;

        this._minThresholdWidth = 320;
        this._maxThresholdWidth = 1480;
        this._minThresholdHeight = 240;
        this._maxThresholdHeight = 820;
        this._stepperDefaultWidth = 108;
        this._controlsDefaultWidth = 52;

        this._defaultHeight = 30;
        this._expandControls = false;
        this._mode = ControlMode.Default;
        this._speed = 0.5;
        this._changingSpeed = false;

        this._notifyChanged$ = new Subject<SequenceDOMRenderer>();
        this._notifySpeedChanged$ = new Subject<number>();

        container.mouseService.documentMouseUp$
            .subscribe(
                (event: Event): void => {
                    if (this._changingSpeed) {
                        this._changingSpeed = false;
                    }
                });
    }

    public get speed(): number {
        return this._speed;
    }

    public get changed$(): Observable<SequenceDOMRenderer> {
        return this._notifyChanged$;
    }

    public get speed$(): Observable<number> {
        return this._notifySpeedChanged$;
    }

    public render(
        edgeStatus: IEdgeStatus,
        configuration: ISequenceConfiguration,
        containerWidth: number,
        speed: number,
        component: SequenceComponent,
        interaction: SequenceDOMInteraction,
        navigator: Navigator): vd.VNode {

        if (configuration.visible === false) {
            return vd.h("div.SequenceContainer", {}, []);
        }

        const stepper: vd.VNode =
            this._createStepper(edgeStatus, configuration, containerWidth, component, interaction, navigator);
        const controls: vd.VNode = this._createSequenceControls(containerWidth);
        const playback: vd.VNode = this._createPlaybackControls(containerWidth, speed);

        return vd.h("div.SequenceContainer", [stepper, controls, playback]);
    }

    public getContainerWidth(element: HTMLElement, configuration: ISequenceConfiguration): number {
        let elementWidth: number = element.offsetWidth;
        let elementHeight: number = element.offsetHeight;

        let minWidth: number = configuration.minWidth;
        let maxWidth: number = configuration.maxWidth;
        if (maxWidth < minWidth) {
            maxWidth = minWidth;
        }

        let relativeWidth: number =
            (elementWidth - this._minThresholdWidth) / (this._maxThresholdWidth - this._minThresholdWidth);
        let relativeHeight: number =
            (elementHeight - this._minThresholdHeight) / (this._maxThresholdHeight - this._minThresholdHeight);

        let coeff: number = Math.max(0, Math.min(1, Math.min(relativeWidth, relativeHeight)));

        return minWidth + coeff * (maxWidth - minWidth);
    }

    private _createSpeedInput(speed: number): vd.VNode {
        this._speed = speed;

        const onSpeed: (e: Event) => void = (e: Event): void => {
            this._speed = Number((<HTMLInputElement>e.target).value) / 1000;
            this._notifySpeedChanged$.next(this._speed);
        };

        const boundingRect: ClientRect = this._container.domContainer.getBoundingClientRect();
        const width: number = Math.max(256, Math.min(410, 0.8 * boundingRect.width)) - 144;

        const speedInput: vd.VNode = vd.h(
            "input.SequenceSpeed",
            {
                max: 1000,
                min: 0,
                onchange: onSpeed,
                oninput: onSpeed,
                onmousedown: (e: Event): void => {
                    this._changingSpeed = true;
                    e.stopPropagation();
                },
                onmousemove: (e: Event): void => {
                    if (this._changingSpeed === true) {
                        e.stopPropagation();
                    }
                },
                style: {
                    width: `${width}px`,
                },
                type: "range",
                value: 1000 * speed,
            },
            []);

        return vd.h("div.SequenceSpeedContainer", [speedInput]);
    }

    private _createPlaybackControls(containerWidth: number, speed: number): vd.VNode {
        if (this._mode !== ControlMode.Playback) {
            return vd.h("div.SequencePlayback", []);
        }

        const switchIcon: vd.VNode = vd.h("div.SequenceSwitchIcon.SequenceIconVisible", []);
        const switchButton: vd.VNode = vd.h("div.SequenceSwitchButton", [switchIcon]);
        const slowIcon: vd.VNode = vd.h("div.SequenceSlowIcon.SequenceIconVisible", []);
        const slowContainer: vd.VNode = vd.h("div.SequenceSlowContainer", [slowIcon]);
        const fastIcon: vd.VNode = vd.h("div.SequenceFastIconGrey.SequenceIconVisible", []);
        const fastContainer: vd.VNode = vd.h("div.SequenceFastContainer", [fastIcon]);
        const closeIcon: vd.VNode = vd.h("div.SequenceCloseIcon.SequenceIconVisible", []);
        const closeButtonProperties: vd.createProperties = {
            onclick: (): void => {
                this._mode = ControlMode.Default;
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
        configuration: ISequenceConfiguration,
        component: SequenceComponent): vd.VNode {

        let canPlay: boolean = configuration.direction === EdgeDirection.Next && nextKey != null ||
            configuration.direction === EdgeDirection.Prev && prevKey != null;

        let onclick: (e: Event) => void = configuration.playing ?
            (e: Event): void => { component.stop(); } :
            canPlay ? (e: Event): void => { component.play(); } : null;

        let buttonProperties: vd.createProperties = { onclick: onclick };

        let iconClass: string = configuration.playing ?
            "Stop" :
            canPlay ? "Play" : "PlayDisabled";

        let icon: vd.VNode = vd.h("div.SequenceComponentIcon", { className: iconClass }, []);

        let buttonClass: string = canPlay ? "SequencePlay" : "SequencePlayDisabled";

        return vd.h("div." + buttonClass, buttonProperties, [icon]);
    }

    private _createSequenceControls(containerWidth: number): vd.VNode {
        const borderRadius: number = Math.round(8 / this._stepperDefaultWidth * containerWidth);
        const expanderProperties: vd.createProperties = {
            onclick: (): void => {
                this._expandControls = !this._expandControls;
                this._mode = ControlMode.Default;
                this._notifyChanged$.next(this);
            },
            style: {
                "border-bottom-right-radius": `${borderRadius}px`,
                "border-top-right-radius": `${borderRadius}px`,
            },
        };
        const expanderBar: vd.VNode = vd.h("div.SequenceExpanderBar", []);
        const expander: vd.VNode = vd.h("div.SequenceExpanderButton", expanderProperties, [expanderBar]);
        const fastIconClassName: string = this._mode === ControlMode.Playback ?
            ".SequenceFastIconGrey.SequenceIconVisible" : ".SequenceFastIcon";
        const fastIcon: vd.VNode = vd.h("div" + fastIconClassName, []);

        const playbackProperties: vd.createProperties = {
            onclick: (): void => {
                this._mode = this._mode === ControlMode.Playback ?
                    ControlMode.Default :
                    ControlMode.Playback;
                this._notifyChanged$.next(this);
            },
        };
        const controls: vd.VNode = vd.h("div.SequencePlaybackButton", playbackProperties, [fastIcon]);

        const properties: vd.createProperties = {
            style: {
                height: (this._defaultHeight / this._stepperDefaultWidth * containerWidth) + "px",
                transform: `translate(${containerWidth / 2 + 2}px, 0)`,
                width: (this._controlsDefaultWidth / this._stepperDefaultWidth * containerWidth) + "px",
            },
        };

        const className: string = ".SequenceControls" +
            (this._expandControls ? ".SequenceControlsExpanded" : "");

        return vd.h("div" + className, properties, [controls, expander]);
    }

    private _createSequenceArrows(
        nextKey: string,
        prevKey: string,
        configuration: ISequenceConfiguration,
        interaction: SequenceDOMInteraction,
        navigator: Navigator): vd.VNode[] {

        let nextProperties: vd.createProperties = {
            onclick: nextKey != null ?
                (e: Event): void => {
                    navigator.moveDir$(EdgeDirection.Next)
                        .subscribe(
                            (node: Node): void => { return; },
                            (error: Error): void => { console.error(error); });
                } :
                null,
            onmouseenter: (e: MouseEvent): void => { interaction.mouseEnterDirection$.next(EdgeDirection.Next); },
            onmouseleave: (e: MouseEvent): void => { interaction.mouseLeaveDirection$.next(EdgeDirection.Next); },
            style: {

            },
        };

        let prevProperties: vd.createProperties = {
            onclick: prevKey != null ?
                (e: Event): void => {
                    navigator.moveDir$(EdgeDirection.Prev)
                        .subscribe(
                            (node: Node): void => { return; },
                            (error: Error): void => { console.error(error); });
                } :
                null,
            onmouseenter: (e: MouseEvent): void => { interaction.mouseEnterDirection$.next(EdgeDirection.Prev); },
            onmouseleave: (e: MouseEvent): void => { interaction.mouseLeaveDirection$.next(EdgeDirection.Prev); },
            style: {

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
        containerWidth: number,
        component: SequenceComponent,
        interaction: SequenceDOMInteraction,
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

        const playingButton: vd.VNode = this._createPlayingButton(nextKey, prevKey, configuration, component);
        const buttons: vd.VNode[] = this._createSequenceArrows(nextKey, prevKey, configuration, interaction, navigator);
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
}

export default SequenceDOMRenderer;
