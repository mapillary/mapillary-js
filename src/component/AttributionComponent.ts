import * as vd from "virtual-dom";

import {
    combineLatest as observableCombineLatest,
    Subscription,
} from "rxjs";

import { map } from "rxjs/operators";

import { Component } from "./Component";
import { IComponentConfiguration } from "./interfaces/IComponentConfiguration";

import { Node } from "../graph/Node";
import { ISize } from "../render/interfaces/ISize";
import { IVNodeHash } from "../render/interfaces/IVNodeHash";
import { Urls } from "../utils/Urls";
import { Container } from "../viewer/Container";
import { Navigator } from "../viewer/Navigator";

export class AttributionComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "attribution";
    private _disposable: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = observableCombineLatest(
            this._navigator.stateService.currentNode$,
            this._container.renderService.size$).pipe(
                map(
                    ([node, size]: [Node, ISize]): IVNodeHash => {
                        return {
                            name: this._name,
                            vnode: this._getAttributionNode(node.username, node.key, node.capturedAt, size.width),
                        };
                    }))
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _getAttributionNode(username: string, key: string, capturedAt: number, width: number): vd.VNode {
        const compact: boolean = width <= 640;

        const mapillaryIcon: vd.VNode = vd.h("div.AttributionMapillaryLogo", []);
        const mapillaryLink: vd.VNode = vd.h(
            "a.AttributionIconContainer",
            { href: Urls.explore, target: "_blank" },
            [mapillaryIcon]);

        const imageBy: string = compact ? `${username}` : `image by ${username}`;
        const imageByContent: vd.VNode = vd.h("div.AttributionUsername", { textContent: imageBy }, []);

        const date: string[] = new Date(capturedAt).toDateString().split(" ");
        const formatted: string = (date.length > 3 ?
            compact ?
                [date[3]] :
                [date[1], date[2] + ",", date[3]] :
            date).join(" ");

        const dateContent: vd.VNode = vd.h("div.AttributionDate", { textContent: formatted }, []);

        const imageLink: vd.VNode =
            vd.h(
                "a.AttributionImageContainer",
                { href: Urls.exploreImage(key), target: "_blank" },
                [imageByContent, dateContent]);

        const compactClass: string = compact ? ".AttributionCompact" : "";

        return vd.h("div.AttributionContainer" + compactClass, {}, [mapillaryLink, imageLink]);
    }
}
