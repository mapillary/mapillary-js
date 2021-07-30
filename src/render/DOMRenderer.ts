import * as vd from "virtual-dom";

import {
    combineLatest as observableCombineLatest,
    Observable,
    Subject,
} from "rxjs";

import {
    distinctUntilChanged,
    filter,
    map,
    pluck,
    publishReplay,
    refCount,
    scan,
} from "rxjs/operators";

import { RenderMode } from "./RenderMode";
import { RenderService } from "./RenderService";
import { ViewportSize } from "./interfaces/ViewportSize";
import { VirtualNodeHash } from "./interfaces/VirtualNodeHash";

import { AnimationFrame } from "../state/interfaces/AnimationFrame";
import { SubscriptionHolder } from "../util/SubscriptionHolder";

interface VirtualNodePatch {
    vNode: vd.VNode;
    vpatch: vd.VPatch[];
}

interface VirtualNodeHashes {
    [name: string]: vd.VNode;
}

interface OffsetStyle {
    bottom: number;
    left: number;
    right: number;
    top: number;
}

interface AdaptiveCanvas {
    elementHeight: number;
    elementWidth: number;
    imageAspect: number;
    renderMode: RenderMode;
}

interface AdaptiveRenderOperation {
    (adaptive: AdaptiveCanvas): AdaptiveCanvas;
}

export class DOMRenderer {
    private _renderService: RenderService;
    private _currentFrame$: Observable<AnimationFrame>;

    private _adaptiveOperation$: Subject<AdaptiveRenderOperation> =
        new Subject<AdaptiveRenderOperation>();
    private _offset$: Observable<OffsetStyle>;

    private _element$: Observable<Element>;
    private _vPatch$: Observable<vd.VPatch[]>;
    private _vNode$: Observable<vd.VNode>;
    private _render$: Subject<VirtualNodeHash> = new Subject<VirtualNodeHash>();
    private _renderAdaptive$: Subject<VirtualNodeHash> = new Subject<VirtualNodeHash>();

    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    constructor(
        element: HTMLElement,
        renderService: RenderService,
        currentFrame$: Observable<AnimationFrame>) {
        this._renderService = renderService;
        this._currentFrame$ = currentFrame$;

        const subs = this._subscriptions;

        const rootNode = vd.create(vd.h("div.mapillary-dom-renderer", []));
        element.appendChild(rootNode);

        this._offset$ = this._adaptiveOperation$.pipe(
            scan(
                (adaptive: AdaptiveCanvas, operation: AdaptiveRenderOperation): AdaptiveCanvas => {
                    return operation(adaptive);
                },
                {
                    elementHeight: element.offsetHeight,
                    elementWidth: element.offsetWidth,
                    imageAspect: 0,
                    renderMode: RenderMode.Fill,
                }),
            filter(
                (adaptive: AdaptiveCanvas): boolean => {
                    return adaptive.imageAspect > 0 && adaptive.elementWidth > 0 && adaptive.elementHeight > 0;
                }),
            map(
                (adaptive: AdaptiveCanvas): OffsetStyle => {
                    const elementAspect = adaptive.elementWidth / adaptive.elementHeight;
                    const ratio = adaptive.imageAspect / elementAspect;

                    let verticalOffset = 0;
                    let horizontalOffset = 0;

                    if (adaptive.renderMode === RenderMode.Letterbox) {
                        if (adaptive.imageAspect > elementAspect) {
                            verticalOffset = adaptive.elementHeight * (1 - 1 / ratio) / 2;
                        } else {
                            horizontalOffset = adaptive.elementWidth * (1 - ratio) / 2;
                        }
                    } else {
                        if (adaptive.imageAspect > elementAspect) {
                            horizontalOffset = -adaptive.elementWidth * (ratio - 1) / 2;
                        } else {
                            verticalOffset = -adaptive.elementHeight * (1 / ratio - 1) / 2;
                        }
                    }

                    return {
                        bottom: verticalOffset,
                        left: horizontalOffset,
                        right: horizontalOffset,
                        top: verticalOffset,
                    };
                }));

        const imageAspectSubscription = this._currentFrame$.pipe(
            filter(
                (frame: AnimationFrame): boolean => {
                    return frame.state.currentImage != null;
                }),
            distinctUntilChanged(
                (k1: string, k2: string): boolean => {
                    return k1 === k2;
                },
                (frame: AnimationFrame): string => {
                    return frame.state.currentImage.id;
                }),
            map(
                (frame: AnimationFrame): number => {
                    return frame.state.currentTransform.basicAspect;
                }),
            map(
                (aspect: number): AdaptiveRenderOperation => {
                    return (adaptive: AdaptiveCanvas): AdaptiveCanvas => {
                        adaptive.imageAspect = aspect;

                        return adaptive;
                    };
                }))
            .subscribe(this._adaptiveOperation$);

        const renderAdaptiveSubscription = observableCombineLatest(
            this._renderAdaptive$.pipe(
                scan(
                    (vNodeHashes: VirtualNodeHashes, vNodeHash: VirtualNodeHash): VirtualNodeHashes => {
                        if (vNodeHash.vNode == null) {
                            delete vNodeHashes[vNodeHash.name];
                        } else {
                            vNodeHashes[vNodeHash.name] = vNodeHash.vNode;
                        }
                        return vNodeHashes;
                    },
                    {})),
            this._offset$).pipe(
                map(
                    (vo: [VirtualNodeHashes, OffsetStyle]): VirtualNodeHash => {
                        const vNodes: vd.VNode[] = [];
                        const hashes: VirtualNodeHashes = vo[0];
                        for (const name in hashes) {
                            if (!hashes.hasOwnProperty(name)) {
                                continue;
                            }

                            vNodes.push(hashes[name]);
                        }

                        const offset = vo[1];

                        const properties: vd.createProperties = {
                            style: {
                                bottom: offset.bottom + "px",
                                left: offset.left + "px",
                                "pointer-events": "none",
                                position: "absolute",
                                right: offset.right + "px",
                                top: offset.top + "px",
                            },
                        };

                        return {
                            name: "mapillary-dom-adaptive-renderer",
                            vNode: vd.h("div.mapillary-dom-adaptive-renderer", properties, vNodes),
                        };
                    }))
            .subscribe(this._render$);

        this._vNode$ = this._render$.pipe(
            scan(
                (vNodeHashes: VirtualNodeHashes, vNodeHash: VirtualNodeHash): VirtualNodeHashes => {
                    if (vNodeHash.vNode == null) {
                        delete vNodeHashes[vNodeHash.name];
                    } else {
                        vNodeHashes[vNodeHash.name] = vNodeHash.vNode;
                    }

                    return vNodeHashes;
                },
                {}),
            map(
                (hashes: VirtualNodeHashes): vd.VNode => {
                    const vNodes: vd.VNode[] = [];
                    for (const name in hashes) {
                        if (!hashes.hasOwnProperty(name)) {
                            continue;
                        }

                        vNodes.push(hashes[name]);
                    }

                    return vd.h("div.mapillary-dom-renderer", vNodes);
                }));

        this._vPatch$ = this._vNode$.pipe(
            scan(
                (nodePatch: VirtualNodePatch, vNode: vd.VNode): VirtualNodePatch => {
                    nodePatch.vpatch = vd.diff(nodePatch.vNode, vNode);
                    nodePatch.vNode = vNode;
                    return nodePatch;
                },
                { vNode: vd.h("div.mapillary-dom-renderer", []), vpatch: null }),
            pluck("vpatch"));

        this._element$ = this._vPatch$.pipe(
            scan(
                (oldElement: Element, vPatch: vd.VPatch[]): Element => {
                    return vd.patch(oldElement, vPatch);
                },
                rootNode),
            publishReplay(1),
            refCount());

        subs.push(imageAspectSubscription);
        subs.push(renderAdaptiveSubscription);
        subs.push(this._element$.subscribe(() => { /*noop*/ }));

        subs.push(this._renderService.size$.pipe(
            map(
                (size: ViewportSize): AdaptiveRenderOperation => {
                    return (adaptive: AdaptiveCanvas): AdaptiveCanvas => {
                        adaptive.elementWidth = size.width;
                        adaptive.elementHeight = size.height;

                        return adaptive;
                    };
                }))
            .subscribe(this._adaptiveOperation$));

        subs.push(this._renderService.renderMode$.pipe(
            map(
                (renderMode: RenderMode): AdaptiveRenderOperation => {
                    return (adaptive: AdaptiveCanvas): AdaptiveCanvas => {
                        adaptive.renderMode = renderMode;

                        return adaptive;
                    };
                }))
            .subscribe(this._adaptiveOperation$));
    }

    public get element$(): Observable<Element> {
        return this._element$;
    }

    public get render$(): Subject<VirtualNodeHash> {
        return this._render$;
    }

    public get renderAdaptive$(): Subject<VirtualNodeHash> {
        return this._renderAdaptive$;
    }

    public clear(name: string): void {
        this._renderAdaptive$.next({ name: name, vNode: null });
        this._render$.next({ name: name, vNode: null });
    }

    public remove(): void {
        this._subscriptions.unsubscribe();
    }
}
