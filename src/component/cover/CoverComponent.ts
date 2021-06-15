import * as vd from "virtual-dom";

import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    of as observableOf,
    Observable,
    Subscriber,
} from "rxjs";

import {
    catchError,
    distinctUntilChanged,
    filter,
    first,
    map,
    publishReplay,
    refCount,
    switchMap,
} from "rxjs/operators";

import { Component } from "../Component";
import { CoverConfiguration } from "../interfaces/CoverConfiguration";

import { MapillaryError } from "../../error/MapillaryError";
import { Image as MImage } from "../../graph/Image";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { ImagesContract } from "../../api/contracts/ImagesContract";
import { CoverState } from "./CoverState";
import { ComponentName } from "../ComponentName";

export class CoverComponent extends Component<CoverConfiguration> {
    public static componentName: ComponentName = "cover";

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        const originalSrc$ = this.configuration$.pipe(
            first(
                (c: CoverConfiguration): boolean => {
                    return !!c.id;
                }),
            filter(
                (c: CoverConfiguration): boolean => {
                    return !c.src;
                }),
            switchMap(
                (c: CoverConfiguration): Observable<string> => {
                    return this._getImageSrc$(c.id).pipe(
                        catchError(
                            (error: Error): Observable<string> => {
                                console.error(error);

                                return observableEmpty();
                            }));
                }),
            publishReplay(1),
            refCount());

        const subs = this._subscriptions;

        subs.push(originalSrc$.pipe(
            map(
                (src: string): CoverConfiguration => {
                    return { src: src };
                }))
            .subscribe(
                (c: CoverConfiguration): void => {
                    this._configurationSubject$.next(c);
                }));

        subs.push(observableCombineLatest(
            this.configuration$,
            originalSrc$).pipe(
                filter(
                    ([c, src]: [CoverConfiguration, string]): boolean => {
                        return !!c.src && c.src !== src;
                    }),
                first())
            .subscribe(
                ([, src]: [CoverConfiguration, string]): void => {
                    window.URL.revokeObjectURL(src);
                }));

        subs.push(this._configuration$.pipe(
            distinctUntilChanged(
                undefined,
                (configuration: CoverConfiguration): CoverState => {
                    return configuration.state;
                }),
            switchMap(
                (configuration: CoverConfiguration): Observable<[CoverState, MImage]> => {
                    return observableCombineLatest(
                        observableOf(configuration.state),
                        this._navigator.stateService.currentImage$);
                }),
            switchMap(
                ([state, image]: [CoverState, MImage]): Observable<[string, string]> => {
                    const keySrc$: Observable<[string, string]> = observableCombineLatest(
                        observableOf(image.id),
                        image.image$.pipe(
                            filter(
                                (imageElement: HTMLImageElement): boolean => {
                                    return !!imageElement;
                                }),
                            map(
                                (imageElement: HTMLImageElement): string => {
                                    return imageElement.src;
                                })));

                    return state === CoverState.Visible ? keySrc$.pipe(first()) : keySrc$;
                }),
            distinctUntilChanged(
                ([k1, s1]: [string, string], [k2, s2]: [string, string]): boolean => {
                    return k1 === k2 && s1 === s2;
                }),
            map(
                ([key, src]: [string, string]): CoverConfiguration => {
                    return { id: key, src: src };
                }))
            .subscribe(this._configurationSubject$));

        subs.push(observableCombineLatest(
            this._configuration$,
            this._container.configurationService.exploreUrl$,
            this._container.renderService.size$).pipe(
                map(
                    ([configuration, exploreUrl, size]:
                        [CoverConfiguration, string, ViewportSize]): VirtualNodeHash => {
                        if (!configuration.src) {
                            return { name: this._name, vNode: vd.h("div", []) };
                        }

                        const compactClass: string = size.width <= 640 || size.height <= 480 ? ".mapillary-cover-compact" : "";

                        if (configuration.state === CoverState.Hidden) {
                            const doneContainer: vd.VNode = vd.h(
                                "div.mapillary-cover-container.mapillary-cover-done" + compactClass,
                                [this._getCoverBackgroundVNode(configuration)]);

                            return { name: this._name, vNode: doneContainer };
                        }

                        const container: vd.VNode = vd.h(
                            "div.mapillary-cover-container" + compactClass,
                            [this._getCoverButtonVNode(configuration, exploreUrl)]);

                        return { name: this._name, vNode: container };
                    }))
            .subscribe(this._container.domRenderer.render$));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): CoverConfiguration {
        return { state: CoverState.Visible };
    }

    private _getCoverButtonVNode(
        configuration: CoverConfiguration,
        exploreUrl: string): vd.VNode {

        const cover: string = configuration.state === CoverState.Loading ? "div.mapillary-cover.mapillary-cover-loading" : "div.mapillary-cover";
        const coverButton: vd.VNode = vd.h(
            "div.mapillary-cover-button",
            [vd.h("div.mapillary-cover-button-icon", [])]);

        const coverLogo: vd.VNode = vd.h(
            "a.mapillary-cover-logo",
            { href: exploreUrl, target: "_blank" },
            []);
        const coverIndicator: vd.VNode = vd.h(
            "div.mapillary-cover-indicator",
            { onclick: (): void => { this.configure({ state: CoverState.Loading }); } },
            []);

        return vd.h(
            cover,
            [
                this._getCoverBackgroundVNode(configuration),
                coverIndicator,
                coverButton,
                coverLogo,
            ]);
    }

    private _getCoverBackgroundVNode(conf: CoverConfiguration): vd.VNode {
        const properties: vd.createProperties = {
            style: { backgroundImage: `url(${conf.src})` },
        };

        const children: vd.VNode[] = [];
        if (conf.state === CoverState.Loading) {
            children.push(vd.h("div.mapillary-cover-spinner", {}, []));
        }

        return vd.h("div.mapillary-cover-background", properties, children);
    }

    private _getImageSrc$(id: string): Observable<string> {
        return Observable.create(
            (subscriber: Subscriber<string>): void => {
                this._navigator.api.getImages$([id])
                    .subscribe(
                        (items: ImagesContract): void => {
                            for (const item of items) {
                                const imageId = typeof id === "number" ?
                                    (<number>id).toString() : id;
                                if (item.node_id !== imageId) {
                                    continue;
                                }

                                this._navigator.api.data
                                    .getImageBuffer(item.node.thumb.url)
                                    .then(
                                        (buffer: ArrayBuffer): void => {
                                            const image = new Image();
                                            image.crossOrigin = "Anonymous";

                                            image.onload = () => {
                                                subscriber.next(image.src);
                                                subscriber.complete();
                                            };

                                            image.onerror = () => {
                                                subscriber.error(new Error(
                                                    `Failed to load cover ` +
                                                    `image (${id})`));
                                            };

                                            const blob = new Blob([buffer]);
                                            image.src = window.URL
                                                .createObjectURL(blob);
                                        },
                                        (error: Error): void => {
                                            subscriber.error(error);
                                        });
                                return;
                            }

                            subscriber.error(
                                new MapillaryError(
                                    `Non existent cover key: ${id}`));
                        },
                        (error: Error): void => {
                            subscriber.error(error);
                        });
            });
    }
}
