import * as vd from "virtual-dom";

import { combineLatest as observableCombineLatest } from "rxjs";
import { map } from "rxjs/operators";

import { Image } from "../../graph/Image";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";

import { Component } from "../Component";
import { ComponentConfiguration } from "../interfaces/ComponentConfiguration";
import { ComponentName } from "../ComponentName";

export function formatCaptureDate(
    capturedAt: number,
    compact: boolean,
    locales?: string | string[],
    timeZone?: string): string {
    const date = new Date(capturedAt);

    if (isNaN(date.getTime())) {
        return date.toString();
    }

    const options: Intl.DateTimeFormatOptions = compact ?
        { year: "numeric" } :
        { day: "numeric", month: "short", year: "numeric" };

    if (timeZone) {
        options.timeZone = timeZone;
    }

    try {
        return new Intl.DateTimeFormat(
            compact ? "en-US" : locales,
            options).format(date);
    } catch {
        options.timeZone = "UTC";
        return new Intl.DateTimeFormat(
            compact ? "en-US" : locales,
            options).format(date);
    }
}

export class AttributionComponent extends Component<ComponentConfiguration> {
    public static componentName: ComponentName = "attribution";

    protected _activate(): void {
        this._subscriptions.push(
            observableCombineLatest(
                this._container.configurationService.exploreUrl$,
                this._navigator.stateService.currentImage$,
                this._container.renderService.size$).pipe(
                    map(
                        ([exploreUrl, image, size]: [string, Image, ViewportSize]): VirtualNodeHash => {
                            const attribution =
                                this._makeAttribution(
                                    image.creatorUsername,
                                    exploreUrl,
                                    image.id,
                                    image.capturedAt,
                                    image.timezone,
                                    size.width);
                            return {
                                name: this._name,
                                vNode: attribution,
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

    private makeImageUrl(exploreUrl: string, id: string): string {
        return `${exploreUrl}/app/?pKey=${id}&focus=photo`;
    }

    private _makeAttribution(
        creatorUsername: string,
        exploreUrl: string,
        imageId: string,
        capturedAt: number,
        timeZone: string | undefined,
        viewportWidth: number)
        : vd.VNode {
        const compact = viewportWidth <= 640;

        const date = [this._makeDate(capturedAt, compact, timeZone)];
        const by = this._makeBy(creatorUsername, exploreUrl, imageId, compact);

        const compactClass = compact ?
            ".mapillary-attribution-compact" : "";

        return vd.h(
            "div.mapillary-attribution-container" + compactClass,
            {},
            [...by, ...date]);
    }

    private _makeBy(
        creatorUsername: string,
        exploreUrl: string,
        imageId: string,
        compact: boolean): vd.VNode[] {

        const icon = vd.h(
            "div.mapillary-attribution-logo",
            []);
        return creatorUsername ?
            this._makeCreatorBy(icon, creatorUsername, exploreUrl, imageId, compact) :
            this._makeGeneralBy(icon, exploreUrl, imageId, compact);
    }

    private _makeCreatorBy(
        icon: vd.VNode,
        creatorUsername: string,
        exploreUrl: string,
        imageId: string,
        compact: boolean): vd.VNode[] {
        const mapillary = vd.h(
            "a.mapillary-attribution-icon-container",
            { href: exploreUrl, rel: "noreferrer", target: "_blank" },
            [icon]);

        const content = compact ?
            `${creatorUsername}` : `image by ${creatorUsername}`;
        const imageBy = vd.h(
            "div.mapillary-attribution-username",
            { textContent: content },
            []);

        const image = vd.h(
            "a.mapillary-attribution-image-container",
            {
                href: this.makeImageUrl(exploreUrl, imageId),
                rel: "noreferrer",
                target: "_blank",
            },
            [imageBy]);

        return [mapillary, image];
    }

    private _makeGeneralBy(
        icon: vd.VNode,
        exploreUrl: string,
        imageId: string,
        compact: boolean): vd.VNode[] {

        const imagesBy = vd.h(
            "div.mapillary-attribution-username",
            { textContent: 'images by' },
            []);

        const mapillary = vd.h(
            "div.mapillary-attribution-icon-container",
            {},
            [icon]);

        const contributors = vd.h(
            "div.mapillary-attribution-username",
            { textContent: 'contributors' },
            []);

        const children = [mapillary, contributors];
        if (!compact) {
            children.unshift(imagesBy);
        }

        const image = vd.h(
            "a.mapillary-attribution-image-container",
            {
                href: this.makeImageUrl(exploreUrl, imageId),
                rel: "noreferrer",
                target: "_blank",
            },
            children);

        return [image];
    }

    private _makeDate(
        capturedAt: number,
        compact: boolean,
        timeZone?: string): vd.VNode {
        return vd.h(
            "div.mapillary-attribution-date",
            {
                textContent: formatCaptureDate(
                    capturedAt,
                    compact,
                    undefined,
                    timeZone),
            },
            []);
    }
}
