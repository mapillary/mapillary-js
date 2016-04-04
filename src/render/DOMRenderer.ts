/// <reference path="../../typings/browser.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";
import * as vd from "virtual-dom";

import {ISize, IVNodeHash, RenderMode, RenderService} from "../Render";
import {IFrame} from "../State";

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
    private _currentFrame$: rx.Observable<IFrame>;

    private _adaptiveOperation$: rx.Subject<IAdaptiveOperation> = new rx.Subject<IAdaptiveOperation>();
    private _offset$: rx.Observable<IOffset>;

    private _element$: rx.Observable<Element>;
    private _vPatch$: rx.Observable<vd.VPatch[]>;
    private _vNode$: rx.Observable<vd.VNode>;
    private _render$: rx.Subject<IVNodeHash> = new rx.Subject<IVNodeHash>();
    private _renderAdaptive$: rx.Subject<IVNodeHash> = new rx.Subject<IVNodeHash>();

    constructor (element: HTMLElement, renderService: RenderService, currentFrame$: rx.Observable<IFrame>) {
        this._renderService = renderService;
        this._currentFrame$ = currentFrame$;

        let rootNode: Element = vd.create(vd.h("div.domRenderer", []));
        element.appendChild(rootNode);

        this._offset$ = this._adaptiveOperation$
            .scan<IAdaptive>(
                (adaptive: IAdaptive, operation: IAdaptiveOperation): IAdaptive => {
                    return operation(adaptive);
                },
                {
                    elementHeight: element.offsetHeight,
                    elementWidth: element.offsetWidth,
                    imageAspect: 0,
                    renderMode: RenderMode.Letterbox,
                })
            .filter(
                (adaptive: IAdaptive): boolean => {
                    return adaptive.imageAspect > 0 && adaptive.elementWidth > 0 && adaptive.elementHeight > 0;
                })
            .map<IOffset>(
                (adaptive: IAdaptive): IOffset => {
                    let elementAspect: number = adaptive.elementWidth / adaptive.elementHeight;
                    let ratio: number = adaptive.imageAspect / elementAspect;

                    let verticalOffset: number = 0;
                    let horizontalOffset: number = 0;

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
                });

        this._currentFrame$
            .filter(
                (frame: IFrame): boolean => {
                    return frame.state.currentNode != null;
                })
            .distinctUntilChanged(
                (frame: IFrame): string => {
                    return frame.state.currentNode.key;
                })
            .map<number>(
                (frame: IFrame): number => {
                    return frame.state.currentTransform.aspect;
                })
            .map<IAdaptiveOperation>(
                 (aspect: number): IAdaptiveOperation => {
                    return (adaptive: IAdaptive): IAdaptive => {
                        adaptive.imageAspect = aspect;

                        return adaptive;
                    };
                })
            .subscribe(this._adaptiveOperation$);

        this._renderAdaptive$
            .scan<IVNodeHashes>(
                (vNodeHashes: IVNodeHashes, vNodeHash: IVNodeHash): IVNodeHashes => {
                    if (vNodeHash.vnode == null) {
                        delete vNodeHashes[vNodeHash.name];
                    } else {
                        vNodeHashes[vNodeHash.name] = vNodeHash.vnode;
                    }
                    return vNodeHashes;
                },
                {})
            .combineLatest(
                this._offset$,
                (vNodeHashes: IVNodeHashes, offset: IOffset): [IVNodeHashes, IOffset] => {
                    return [vNodeHashes, offset];
                })
            .map<IVNodeHash>(
                (vo: [IVNodeHashes, IOffset]): IVNodeHash => {
                    let vNodes: vd.VNode[] = _.values(vo[0]);
                    let offset: IOffset = vo[1];

                    let properties: vd.createProperties = {
                        style: {
                            bottom: offset.bottom + "px",
                            left: offset.left + "px",
                            position: "absolute",
                            right: offset.right + "px",
                            top: offset.top + "px",
                            zIndex: -1,
                        },
                    };

                    return {
                        name: "adaptiveDomRenderer",
                        vnode: vd.h("div.adaptiveDomRenderer", properties, vNodes),
                    };
                })
            .subscribe(this._render$);

        this._vNode$ = this._render$
            .scan<IVNodeHashes>(
                (vNodeHashes: IVNodeHashes, vNodeHash: IVNodeHash): IVNodeHashes => {
                    if (vNodeHash.vnode == null) {
                        delete vNodeHashes[vNodeHash.name];
                    } else {
                        vNodeHashes[vNodeHash.name] = vNodeHash.vnode;
                    }

                    return vNodeHashes;
                },
                {})
            .map(
                (vNodeHashes: IVNodeHashes): vd.VNode => {
                    let vNodes: vd.VNode[] = _.values(vNodeHashes);
                    return vd.h("div.domRenderer", vNodes);
                });

        this._vPatch$ = this._vNode$
            .scan<INodePatch>(
                (nodePatch: INodePatch, vNode: vd.VNode): INodePatch => {
                    nodePatch.vpatch = vd.diff(nodePatch.vnode, vNode);
                    nodePatch.vnode = vNode;
                    return nodePatch;
                },
                {vnode: vd.h("div.domRenderer", []), vpatch: null})
            .pluck<vd.VPatch[]>("vpatch");

        this._element$ = this._vPatch$
            .scan(
                (oldElement: Element, vPatch: vd.VPatch[]): Element => {
                    return vd.patch(oldElement, vPatch);
                },
                rootNode)
            .shareReplay(1);

        this._element$.subscribe();

        this._renderService.size$
            .map<IAdaptiveOperation>(
                (size: ISize): IAdaptiveOperation => {
                    return (adaptive: IAdaptive): IAdaptive => {
                        adaptive.elementWidth = size.width;
                        adaptive.elementHeight = size.height;

                        return adaptive;
                    };
                })
            .subscribe(this._adaptiveOperation$);

        this._renderService.renderMode$
            .map<IAdaptiveOperation>(
                (renderMode: RenderMode): IAdaptiveOperation => {
                    return (adaptive: IAdaptive): IAdaptive => {
                        adaptive.renderMode = renderMode;

                        return adaptive;
                    };
                })
            .subscribe(this._adaptiveOperation$);
    }

    public get element$(): rx.Observable<Element> {
        return this._element$;
    }

    public get render$(): rx.Subject<IVNodeHash> {
        return this._render$;
    }

    public get renderAdaptive$(): rx.Subject<IVNodeHash> {
        return this._renderAdaptive$;
    }

    public clear(name: string): void {
        this._renderAdaptive$.onNext({name: name, vnode: null});
        this._render$.onNext({name: name, vnode: null});
    }
}

export default DOMRenderer;
