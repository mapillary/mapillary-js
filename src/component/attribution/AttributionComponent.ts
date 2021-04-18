import * as vd from "virtual-dom";

import { combineLatest as observableCombineLatest } from "rxjs";
import { map } from "rxjs/operators";

import { Image } from "../../graph/Image";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { ViewerConfiguration } from "../../viewer/ViewerConfiguration";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";

import { Component } from "../Component";
import { ComponentConfiguration } from "../interfaces/ComponentConfiguration";
import { ComponentName } from "../ComponentName";

export class AttributionComponent extends Component<ComponentConfiguration> {
    public static componentName: ComponentName = "attribution";

    constructor(
        name: string,
        container: Container,
        navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._subscriptions.push(observableCombineLatest(
            this._navigator.stateService.currentImage$,
            this._container.renderService.size$).pipe(
                map(
                    ([image, size]: [Image, ViewportSize]): VirtualNodeHash => {
                        return {
                            name: this._name,
                            vNode: this._getAttributionVNode(
                                image.creatorUsername,
                                image.id,
                                image.capturedAt,
                                size.width),
                        };
                    }))
            .subscribe(this._container.domRenderer.render$));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): ComponentConfiguration {
        return {};
    }

    private _getAttributionVNode(
        username: string,
        id: string,
        capturedAt: number,
        width: number)
        : vd.VNode {
        const compact = width <= 640;

        const mapillaryIcon = vd.h(
            "div.AttributionMapillaryLogo",
            []);
        const mapillaryLink = vd.h(
            "a.AttributionIconContainer",
            { href: ViewerConfiguration.explore, target: "_blank" },
            [mapillaryIcon]);

        const imageBy = compact ?
            `${username}` : `image by ${username}`;
        const imageByContent = vd.h(
            "div.AttributionUsername",
            { textContent: imageBy },
            []);

        const date = new Date(capturedAt)
            .toDateString()
            .split(" ");
        const formatted = (date.length > 3 ?
            compact ?
                [date[3]] :
                [date[1], date[2] + ",", date[3]] :
            date).join(" ");

        const dateContent = vd.h(
            "div.AttributionDate",
            { textContent: formatted },
            []);

        const imageLink =
            vd.h(
                "a.mapillary-attribution-image-container",
                {
                    href: ViewerConfiguration.exploreImage(id),
                    target: "_blank",
                },
                [imageByContent, dateContent]);

        const compactClass = compact ?
            ".mapillary-attribution-compact" : "";

        return vd.h(
            "div.mapillary-attribution-container" + compactClass,
            {},
            [mapillaryLink, imageLink]);
    }
}
