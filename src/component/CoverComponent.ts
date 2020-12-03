import {
    of as observableOf,
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    Observable,
    Subscription,
    Subscriber,
} from "rxjs";

import { map, distinctUntilChanged, switchMap, first, filter, catchError, publishReplay, refCount } from "rxjs/operators";
import * as vd from "virtual-dom";

import {
    CoverState,
    ICoverConfiguration,
    ComponentService,
    Component,
} from "../Component";
import { Node } from "../Graph";
import {
    IVNodeHash,
    ISize,
} from "../Render";
import { Urls } from "../Utils";
import {
    Container,
    ImageSize,
    Navigator,
} from "../Viewer";
import IFullNode from "../api/interfaces/IFullNode";
import MapillaryError from "../error/MapillaryError";

export class CoverComponent extends Component<ICoverConfiguration> {
    public static componentName: string = "cover";

    private _renderSubscription: Subscription;
    private _keySubscription: Subscription;
    private _configureSrcSubscription: Subscription;
    private _revokeUrlSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public _activate(): void {
        const originalSrc$: Observable<string> = this.configuration$.pipe(
            first(
                (c: ICoverConfiguration): boolean => {
                    return !!c.key;
                }),
            filter(
                (c: ICoverConfiguration): boolean => {
                    return !c.src;
                }),
            switchMap(
                (c: ICoverConfiguration): Observable<string> => {
                    return this._getImageSrc$(c.key).pipe(
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
                (src: string): ICoverConfiguration => {
                    return { src: src };
                }))
            .subscribe(
                (c: ICoverConfiguration): void => {
                    this._configurationSubject$.next(c);
                });

        this._revokeUrlSubscription = observableCombineLatest(
            this.configuration$,
            originalSrc$).pipe(
                filter(
                    ([c, src]: [ICoverConfiguration, string]): boolean => {
                        return !!c.src && c.src !== src;
                    }),
                first())
            .subscribe(
                ([c, src]: [ICoverConfiguration, string]): void => {
                    window.URL.revokeObjectURL(src);
                });

        this._keySubscription = this._configuration$.pipe(
            distinctUntilChanged(
                undefined,
                (configuration: ICoverConfiguration): CoverState => {
                    return configuration.state;
                }),
            switchMap(
                (configuration: ICoverConfiguration): Observable<[CoverState, Node]> => {
                    return observableCombineLatest(
                        observableOf(configuration.state),
                        this._navigator.stateService.currentNode$);
                }),
            switchMap(
                ([state, node]: [CoverState, Node]): Observable<[string, string]> => {
                    const keySrc$: Observable<[string, string]> = observableCombineLatest(
                        observableOf(node.key),
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
                ([key, src]: [string, string]): ICoverConfiguration => {
                    return { key: key, src: src };
                }))
            .subscribe(this._configurationSubject$);

        this._renderSubscription = observableCombineLatest(
            this._configuration$,
            this._container.renderService.size$).pipe(
                map(
                    ([configuration, size]: [ICoverConfiguration, ISize]): IVNodeHash => {
                        if (!configuration.src) {
                            return { name: this._name, vnode: vd.h("div", []) };
                        }

                        const compactClass: string = size.width <= 640 || size.height <= 480 ? ".CoverCompact" : "";

                        if (configuration.state === CoverState.Hidden) {
                            const doneContainer: vd.VNode = vd.h(
                                "div.CoverContainer.CoverDone" + compactClass,
                                [this._getCoverBackgroundVNode(configuration)]);

                            return { name: this._name, vnode: doneContainer };
                        }

                        const container: vd.VNode = vd.h(
                            "div.CoverContainer" + compactClass,
                            [this._getCoverButtonVNode(configuration)]);

                        return { name: this._name, vnode: container };
                    }))
            .subscribe(this._container.domRenderer.render$);
    }

    public _deactivate(): void {
        this._renderSubscription.unsubscribe();
        this._keySubscription.unsubscribe();
        this._configureSrcSubscription.unsubscribe();
        this._revokeUrlSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): ICoverConfiguration {
        return { state: CoverState.Visible };
    }

    private _getCoverButtonVNode(configuration: ICoverConfiguration): vd.VNode {
        const cover: string = configuration.state === CoverState.Loading ? "div.Cover.CoverLoading" : "div.Cover";
        const coverButton: vd.VNode = vd.h(
            "div.CoverButton",
            [vd.h("div.CoverButtonIcon", [])]);

        const coverLogo: vd.VNode = vd.h("a.CoverLogo", { href: Urls.explore, target: "_blank" }, []);
        const coverIndicator: vd.VNode = vd.h(
            "div.CoverIndicator",
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

    private _getCoverBackgroundVNode(conf: ICoverConfiguration): vd.VNode {
        const properties: vd.createProperties = {
            style: { backgroundImage: `url(${conf.src})` },
        };

        const children: vd.VNode[] = [];
        if (conf.state === CoverState.Loading) {
            children.push(vd.h("div.Spinner", {}, []));
        }

        return vd.h("div.CoverBackground", properties, children);
    }

    private _getImageSrc$(key: string): Observable<string> {
        return Observable.create(
            (subscriber: Subscriber<string>): void => {
                this._navigator.api.imageByKeyFull$([key])
                    .subscribe(
                        (fullNodes: { [key: string]: IFullNode; }): void => {
                            if (!fullNodes[key]) {
                                subscriber.error(new MapillaryError(`Non existent cover key: ${key}`));
                                return;
                            }

                            this._navigator.api.data
                                .getImage(fullNodes[key].thumb640_url)
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

ComponentService.registerCover(CoverComponent);
export default CoverComponent;
