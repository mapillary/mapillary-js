import { combineLatest as observableCombineLatest, Subscription } from "rxjs";

import {
    scan,
    filter,
    map,
    distinctUntilChanged,
    pluck,
    refCount,
    publishReplay,
} from "rxjs/operators";

import * as vd from "virtual-dom";

import { Observable, Subject } from "rxjs";

import { ISize, IVNodeHash, RenderMode, RenderService } from "../Render";
import { IFrame } from "../State";
import SubscriptionHolder from "../utils/SubscriptionHolder";

interface INodePatch {
    vnode: vd.VNode;
    vpatch: vd.VPatch[];
}

interface IVNodeHashes {
    [name: string]: vd.VNode;
}

interface IOffset {
    bottom: number;
    left: number;
    right: number;
    top: number;
}

interface IAdaptive {
    elementHeight: number;
    elementWidth: number;
    imageAspect: number;
    renderMode: RenderMode;
}

interface IAdaptiveOperation {
    (adaptive: IAdaptive): IAdaptive;
}

export class DOMRenderer {
    private _renderService: RenderService;
    private _currentFrame$: Observable<IFrame>;

    private _adaptiveOperation$: Subject<IAdaptiveOperation> =
        new Subject<IAdaptiveOperation>();
    private _offset$: Observable<IOffset>;

    private _element$: Observable<Element>;
    private _vPatch$: Observable<vd.VPatch[]>;
    private _vNode$: Observable<vd.VNode>;
    private _render$: Subject<IVNodeHash> = new Subject<IVNodeHash>();
    private _renderAdaptive$: Subject<IVNodeHash> = new Subject<IVNodeHash>();

    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    constructor(
        element: HTMLElement,
        renderService: RenderService,
        currentFrame$: Observable<IFrame>) {
        this._renderService = renderService;
        this._currentFrame$ = currentFrame$;

        const subs = this._subscriptions;

        const rootNode = vd.create(vd.h("div.domRenderer", []));
        element.appendChild(rootNode);

        this._offset$ = this._adaptiveOperation$.pipe(
            scan(
                (adaptive: IAdaptive, operation: IAdaptiveOperation): IAdaptive => {
                    return operation(adaptive);
                },
                {
                    elementHeight: element.offsetHeight,
                    elementWidth: element.offsetWidth,
                    imageAspect: 0,
                    renderMode: RenderMode.Fill,
                }),
            filter(
                (adaptive: IAdaptive): boolean => {
                    return adaptive.imageAspect > 0 && adaptive.elementWidth > 0 && adaptive.elementHeight > 0;
                }),
            map(
                (adaptive: IAdaptive): IOffset => {
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
                (frame: IFrame): boolean => {
                    return frame.state.currentNode != null;
                }),
            distinctUntilChanged(
                (k1: string, k2: string): boolean => {
                    return k1 === k2;
                },
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                }),
            map(
                (frame: IFrame): number => {
                    return frame.state.currentTransform.basicAspect;
                }),
            map(
                (aspect: number): IAdaptiveOperation => {
                    return (adaptive: IAdaptive): IAdaptive => {
                        adaptive.imageAspect = aspect;

                        return adaptive;
                    };
                }))
            .subscribe(this._adaptiveOperation$);

        const renderAdaptiveSubscription = observableCombineLatest(
            this._renderAdaptive$.pipe(
                scan(
                    (vNodeHashes: IVNodeHashes, vNodeHash: IVNodeHash): IVNodeHashes => {
                        if (vNodeHash.vnode == null) {
                            delete vNodeHashes[vNodeHash.name];
                        } else {
                            vNodeHashes[vNodeHash.name] = vNodeHash.vnode;
                        }
                        return vNodeHashes;
                    },
                    {})),
            this._offset$).pipe(
                map(
                    (vo: [IVNodeHashes, IOffset]): IVNodeHash => {
                        const vNodes: vd.VNode[] = [];
                        const hashes: IVNodeHashes = vo[0];
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
                            name: "adaptiveDomRenderer",
                            vnode: vd.h("div.adaptiveDomRenderer", properties, vNodes),
                        };
                    }))
            .subscribe(this._render$);

        this._vNode$ = this._render$.pipe(
            scan(
                (vNodeHashes: IVNodeHashes, vNodeHash: IVNodeHash): IVNodeHashes => {
                    if (vNodeHash.vnode == null) {
                        delete vNodeHashes[vNodeHash.name];
                    } else {
                        vNodeHashes[vNodeHash.name] = vNodeHash.vnode;
                    }

                    return vNodeHashes;
                },
                {}),
            map(
                (hashes: IVNodeHashes): vd.VNode => {
                    const vNodes: vd.VNode[] = [];
                    for (const name in hashes) {
                        if (!hashes.hasOwnProperty(name)) {
                            continue;
                        }

                        vNodes.push(hashes[name]);
                    }

                    return vd.h("div.domRenderer", vNodes);
                }));

        this._vPatch$ = this._vNode$.pipe(
            scan(
                (nodePatch: INodePatch, vNode: vd.VNode): INodePatch => {
                    nodePatch.vpatch = vd.diff(nodePatch.vnode, vNode);
                    nodePatch.vnode = vNode;
                    return nodePatch;
                },
                { vnode: vd.h("div.domRenderer", []), vpatch: null }),
            pluck<INodePatch, vd.VPatch[]>("vpatch"));

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
                (size: ISize): IAdaptiveOperation => {
                    return (adaptive: IAdaptive): IAdaptive => {
                        adaptive.elementWidth = size.width;
                        adaptive.elementHeight = size.height;

                        return adaptive;
                    };
                }))
            .subscribe(this._adaptiveOperation$));

        subs.push(this._renderService.renderMode$.pipe(
            map(
                (renderMode: RenderMode): IAdaptiveOperation => {
                    return (adaptive: IAdaptive): IAdaptive => {
                        adaptive.renderMode = renderMode;

                        return adaptive;
                    };
                }))
            .subscribe(this._adaptiveOperation$));
    }

    public get element$(): Observable<Element> {
        return this._element$;
    }

    public get render$(): Subject<IVNodeHash> {
        return this._render$;
    }

    public get renderAdaptive$(): Subject<IVNodeHash> {
        return this._renderAdaptive$;
    }

    public clear(name: string): void {
        this._renderAdaptive$.next({ name: name, vnode: null });
        this._render$.next({ name: name, vnode: null });
    }

    public remove(): void {
        this._subscriptions.unsubscribe();
    }
}

export default DOMRenderer;
