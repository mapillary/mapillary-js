/// <reference path="../../../typings/browser.d.ts" />

import * as vd from "virtual-dom";

import {ISequenceConfiguration, SequenceComponent} from "../../Component";
import {EdgeDirection} from "../../Edge";
import {Node} from "../../Graph";
import {Navigator} from "../../Viewer";

export class SequenceDOMRenderer {
    public render(
        node: Node,
        configuration: ISequenceConfiguration,
        component: SequenceComponent,
        navigator: Navigator): vd.VNode {

        let hasNext: boolean = false;
        let hasPrev: boolean = false;

        for (let edge of node.edges) {
            if (edge.data.direction === EdgeDirection.Next) {
                hasNext = true;
            }

            if (edge.data.direction === EdgeDirection.Prev) {
                hasPrev = true;
            }
        }

        let playingButton: vd.VNode = this._createPlayingButton(hasNext, hasPrev, configuration, component);
        let arrows: vd.VNode[] = this._createSequenceArrows(hasNext, hasPrev, node, navigator);

        let containerProperties: vd.createProperties = {
            style: { height: "30px", width: "100px" },
        };

        return vd.h("div.SequenceContainer", containerProperties, arrows.concat([playingButton]));
    }

    private _createPlayingButton(
        hasNext: boolean,
        hasPrev: boolean,
        configuration: ISequenceConfiguration,
        component: SequenceComponent): vd.VNode {

        let canPlay: boolean = configuration.direction === EdgeDirection.Next && hasNext ||
            configuration.direction === EdgeDirection.Prev && hasPrev;

        let onclick: (e: Event) => void = configuration.playing ?
            (e: Event): void => { component.stop(); } :
            canPlay ? (e: Event): void => { component.play(); } : null;

        let buttonProperties: vd.createProperties = {
            onclick: onclick,
            style: {
                height: "100%",
                left: "33%",
                position: "absolute",
                width: "34%",
            },
        };

        let buttonClass: string = canPlay ? "SequencePlay" : "SequencePlayDisabled";

        let icon: vd.VNode = vd.h("span", { textContent: configuration.playing ? "s" : "p" }, []);

        return vd.h("div." + buttonClass, buttonProperties, [icon]);
    }

    private _createSequenceArrows(hasNext: boolean, hasPrev: boolean, node: Node, navigator: Navigator): vd.VNode[] {
        let nextProperties: vd.createProperties = {
            onclick: hasNext ?
                (e: Event): void => { navigator.moveDir(EdgeDirection.Next).subscribe(); } :
                null,
            style: {
                height: "100%",
                left: "67%",
                position: "absolute",
                width: "33%",
            },
        };

        let prevProperties: vd.createProperties = {
            onclick: hasPrev ?
                (e: Event): void => { navigator.moveDir(EdgeDirection.Prev).subscribe(); } :
                null,
            style: {
                height: "100%",
                left: "0%",
                position: "absolute",
                width: "33%",
            },
        };

        let nextClass: string = hasNext ? "SequenceStep" : "SequenceStepDisabled";
        let prevClass: string = hasPrev ? "SequenceStep" : "SequenceStepDisabled";

        let nextIcon: vd.VNode = vd.h("span", { textContent: "n" }, []);
        let prevIcon: vd.VNode = vd.h("span", { textContent: "p" }, []);

        return [
            vd.h("div." + nextClass, nextProperties, [nextIcon]),
            vd.h("div." + prevClass, prevProperties, [prevIcon]),
        ];
    }
}

export default SequenceDOMRenderer;
