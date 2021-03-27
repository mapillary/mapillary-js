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
import { Node } from "../../graph/Node";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { ViewerConfiguration } from "../../viewer/ViewerConfiguration";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { ImagesContract } from "../../api/contracts/ImagesContract";
import { CoverState } from "./CoverState";

export class CoverComponent extends Component<CoverConfiguration> {
    public static componentName: string = "cover";

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
                (configuration: CoverConfiguration): Observable<[CoverState, Node]> => {
                    return observableCombineLatest(
                        observableOf(configuration.state),
                        this._navigator.stateService.currentNode$);
                }),
            switchMap(
                ([state, node]: [CoverState, Node]): Observable<[string, string]> => {
                    const keySrc$: Observable<[string, string]> = observableCombineLatest(
                        observableOf(node.id),
                        node.image$.pipe(
                            filter(
                                (image: HTMLImageElement): boolean => {
                                    return !!image;
                                }),
                            map(
                                (image: HTMLImageElement): string => {
                                    return image.src;
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
            this._container.renderService.size$).pipe(
                map(
                    ([configuration, size]: [CoverConfiguration, ViewportSize]): VirtualNodeHash => {
                        if (!configuration.src) {
                            return { name: this._name, vnode: vd.h("div", []) };
                        }

                        const compactClass: string = size.width <= 640 || size.height <= 480 ? ".mapillary-cover-compact" : "";

                        if (configuration.state === CoverState.Hidden) {
                            const doneContainer: vd.VNode = vd.h(
                                "div.mapillary-cover-container.mapillary-cover-done" + compactClass,
                                [this._getCoverBackgroundVNode(configuration)]);

                            return { name: this._name, vnode: doneContainer };
                        }

                        const container: vd.VNode = vd.h(
                            "div.mapillary-cover-container" + compactClass,
                            [this._getCoverButtonVNode(configuration)]);

                        return { name: this._name, vnode: container };
                    }))
            .subscribe(this._container.domRenderer.render$));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): CoverConfiguration {
        return { state: CoverState.Visible };
    }

    private _getCoverButtonVNode(configuration: CoverConfiguration): vd.VNode {
        const cover: string = configuration.state === CoverState.Loading ? "div.mapillary-cover.mapillary-cover-loading" : "div.mapillary-cover";
        const coverButton: vd.VNode = vd.h(
            "div.mapillary-cover-button",
            [vd.h("div.mapillary-cover-button-icon", [])]);

        const coverLogo: vd.VNode = vd.h("a.mapillary-cover-logo", { href: ViewerConfiguration.explore, target: "_blank" }, []);
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
                                if (item.node_id !== id) {
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
