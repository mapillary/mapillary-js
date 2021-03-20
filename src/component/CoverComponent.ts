import * as vd from "virtual-dom";

import {
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    of as observableOf,
    Observable,
    Subscription,
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

import { Component } from "./Component";
import { CoverState, CoverConfiguration } from "./interfaces/CoverConfiguration";

import { ImageEnt } from "../api/ents/ImageEnt";
import { MapillaryError } from "../error/MapillaryError";
import { Node } from "../graph/Node";
import { ViewportSize } from "../render/interfaces/ViewportSize";
import { VirtualNodeHash } from "../render/interfaces/VirtualNodeHash";
import { Urls } from "../utils/Urls";
import { Container } from "../viewer/Container";
import { Navigator } from "../viewer/Navigator";

export class CoverComponent extends Component<CoverConfiguration> {
    public static componentName: string = "cover";

    private _renderSubscription: Subscription;
    private _keySubscription: Subscription;
    private _configureSrcSubscription: Subscription;
    private _revokeUrlSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        const originalSrc$: Observable<string> = this.configuration$.pipe(
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

        this._configureSrcSubscription = originalSrc$.pipe(
            map(
                (src: string): CoverConfiguration => {
                    return { src: src };
                }))
            .subscribe(
                (c: CoverConfiguration): void => {
                    this._configurationSubject$.next(c);
                });

        this._revokeUrlSubscription = observableCombineLatest(
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
                });

        this._keySubscription = this._configuration$.pipe(
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
            .subscribe(this._configurationSubject$);

        this._renderSubscription = observableCombineLatest(
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
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._renderSubscription.unsubscribe();
        this._keySubscription.unsubscribe();
        this._configureSrcSubscription.unsubscribe();
        this._revokeUrlSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): CoverConfiguration {
        return { state: CoverState.Visible };
    }

    private _getCoverButtonVNode(configuration: CoverConfiguration): vd.VNode {
        const cover: string = configuration.state === CoverState.Loading ? "div.mapillary-cover.mapillary-cover-loading" : "div.mapillary-cover";
        const coverButton: vd.VNode = vd.h(
            "div.mapillary-cover-button",
            [vd.h("div.mapillary-cover-button-icon", [])]);

        const coverLogo: vd.VNode = vd.h("a.mapillary-cover-logo", { href: Urls.explore, target: "_blank" }, []);
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

    private _getImageSrc$(key: string): Observable<string> {
        return Observable.create(
            (subscriber: Subscriber<string>): void => {
                this._navigator.api.getImages$([key])
                    .subscribe(
                        (fullNodes: { [key: string]: ImageEnt; }): void => {
                            if (!fullNodes[key]) {
                                subscriber.error(new MapillaryError(`Non existent cover key: ${key}`));
                                return;
                            }

                            this._navigator.api.data
                                .getImageBuffer(fullNodes[key].thumb640_url)
                                .then(
                                    (buffer: ArrayBuffer): void => {
                                        const image: HTMLImageElement = new Image();
                                        image.crossOrigin = "Anonymous";

                                        image.onload = () => {
                                            subscriber.next(image.src);
                                            subscriber.complete();
                                        };

                                        image.onerror = () => {
                                            subscriber.error(new Error(`Failed to load cover image (${key})`));
                                        };

                                        const blob: Blob = new Blob([buffer]);
                                        image.src = window.URL.createObjectURL(blob);
                                    },
                                    (error: Error): void => {
                                        subscriber.error(error);
                                    });
                        },
                        (error: Error): void => {
                            subscriber.error(error);
                        });
            });
    }
}
