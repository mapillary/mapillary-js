/// <reference path="../../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {
    ISequenceConfiguration,
    SequenceComponent,
    SequenceDOMInteraction,
} from "../../Component";
import {EdgeDirection} from "../../Edge";
import {IEdgeStatus, Node} from "../../Graph";
import {Navigator} from "../../Viewer";

export class SequenceDOMRenderer {
    private _minThresholdWidth: number;
    private _maxThresholdWidth: number;
    private _minThresholdHeight: number;
    private _maxThresholdHeight: number;
    private _stepperDefaultWidth: number;
    private _controlsDefaultWidth: number;
    private _defaultHeight: number;
    private _expandControls: boolean;

    private _notifyChanged$: Subject<void>;

    constructor(element: HTMLElement) {
        this._minThresholdWidth = 320;
        this._maxThresholdWidth = 1480;
        this._minThresholdHeight = 240;
        this._maxThresholdHeight = 820;
        this._stepperDefaultWidth = 108;
        this._controlsDefaultWidth = 52;
        this._defaultHeight = 30;
        this._expandControls = false;

        this._notifyChanged$ = new Subject<void>();
    }

    public get changed$(): Observable<void> {
        return this._notifyChanged$;
    }

    public render(
        edgeStatus: IEdgeStatus,
        configuration: ISequenceConfiguration,
        containerWidth: number,
        component: SequenceComponent,
        interaction: SequenceDOMInteraction,
        navigator: Navigator): vd.VNode {

        if (configuration.visible === false) {
            return vd.h("div.SequenceContainer", {}, []);
        }

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

        let playingButton: vd.VNode = this._createPlayingButton(nextKey, prevKey, configuration, component);
        let buttons: vd.VNode[] = this._createSequenceArrows(nextKey, prevKey, configuration, interaction, navigator);
        buttons.splice(1, 0, playingButton);

        let containerProperties: vd.createProperties = {
            oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); },
            style: {
                height: (this._defaultHeight / this._stepperDefaultWidth * containerWidth) + "px",
                width: containerWidth + "px",
            },
        };

        let stepper: vd.VNode = vd.h("div.SequenceStepper", containerProperties, buttons);

        let controls: vd.VNode = this._createSequenceControls(containerWidth);

        return vd.h("div.SequenceContainer", [stepper, controls]);
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

        let buttonProperties: vd.createProperties = {
            onclick: onclick,
            style: {

            },
        };

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
                this._notifyChanged$.next(null);
            },
            style: {
                "border-bottom-right-radius": `${borderRadius}px`,
                "border-top-right-radius": `${borderRadius}px`,
            },
        };

        const expanderBar: vd.VNode = vd.h("div.SequenceExpanderBar", []);
        const expander: vd.VNode = vd.h("div.SequenceExpanderButton", expanderProperties, [expanderBar]);
        const fastIcon: vd.VNode = vd.h("div.SequenceFastIcon", []);
        const controls: vd.VNode = vd.h("div.SequenceControlsButton", [fastIcon]);

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
