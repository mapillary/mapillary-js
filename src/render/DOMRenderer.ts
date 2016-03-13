/// <reference path="../../typings/browser.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";
import * as vd from "virtual-dom";

import {RenderMode, ISize, RenderService} from "../Render";
import {IFrame} from "../State";

export interface IVNodeHash {
    name: string;
    vnode: vd.VNode;
}

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

interface IAdaptable {
    elementHeight: number;
    elementWidth: number;
    imageAspect: number;
    renderMode: RenderMode;
}

interface IAdaptableOperation {
    (adaptable: IAdaptable): IAdaptable;
}

export class DOMRenderer {
    private _renderService: RenderService;
    private _currentFrame$: rx.Observable<IFrame>;

    private _adaptableOperation$: rx.Subject<IAdaptableOperation> = new rx.Subject<IAdaptableOperation>();
    private _offset$: rx.Observable<IOffset>;

    private _element$: rx.ConnectableObservable<Element>;
    private _vPatch$: rx.Observable<vd.VPatch[]>;
    private _vNode$: rx.Observable<vd.VNode>;
    private _render$: rx.Subject<any> = new rx.Subject<any>();
    private _renderAdaptable$: rx.Subject<IVNodeHash> = new rx.Subject<IVNodeHash>();

    constructor (element: HTMLElement, renderService: RenderService, currentFrame$: rx.Observable<IFrame>) {
        this._renderService = renderService;
        this._currentFrame$ = currentFrame$;

        let rootNode: Element = vd.create(vd.h("div.domRenderer", []));
        element.appendChild(rootNode);

        this._offset$ = this._adaptableOperation$
            .scan<IAdaptable>(
                (adaptable: IAdaptable, operation: IAdaptableOperation): IAdaptable => {
                    return operation(adaptable);
                },
                {
                    elementHeight: element.offsetHeight,
                    elementWidth: element.offsetWidth,
                    imageAspect: 0,
                    renderMode: RenderMode.Letterbox,
                })
            .filter(
                (adaptable: IAdaptable): boolean => {
                    return adaptable.imageAspect > 0 && adaptable.elementWidth > 0 && adaptable.elementHeight > 0;
                })
            .map<IOffset>(
                (adaptable: IAdaptable): IOffset => {
                    let elementAspect: number = adaptable.elementWidth / adaptable.elementHeight;
                    let ratio: number = adaptable.imageAspect / elementAspect;

                    let verticalOffset: number = 0;
                    let horizontalOffset: number = 0;

                    if (adaptable.renderMode === RenderMode.Letterbox) {
                        if (adaptable.imageAspect > elementAspect) {
                            verticalOffset = adaptable.elementHeight * (1 - 1 / ratio) / 2;
                        } else {
                            horizontalOffset = adaptable.elementWidth * (1 - ratio) / 2;
                        }
                    } else {
                        if (adaptable.imageAspect > elementAspect) {
                            horizontalOffset = -adaptable.elementWidth * (ratio - 1) / 2;
                        } else {
                            verticalOffset = -adaptable.elementHeight * (1 / ratio - 1) / 2;
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
            .map<IAdaptableOperation>(
                 (aspect: number): IAdaptableOperation => {
                    return (adaptable: IAdaptable): IAdaptable => {
                        adaptable.imageAspect = aspect;

                        return adaptable;
                    };
                })
            .subscribe(this._adaptableOperation$);

        this._renderService.size$
            .map<IAdaptableOperation>(
                (size: ISize): IAdaptableOperation => {
                    return (adaptable: IAdaptable): IAdaptable => {
                        adaptable.elementWidth = size.width;
                        adaptable.elementHeight = size.height;

                        return adaptable;
                    };
                })
            .subscribe(this._adaptableOperation$);

        this._renderService.renderMode$
            .map<IAdaptableOperation>(
                (renderMode: RenderMode): IAdaptableOperation => {
                    return (adaptable: IAdaptable): IAdaptable => {
                        adaptable.renderMode = renderMode;

                        return adaptable;
                    };
                })
            .subscribe(this._adaptableOperation$);

        this._renderAdaptable$
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
                        name: "adaptableDomRenderer",
                        vnode: vd.h("div.adaptableDomRenderer", properties, vNodes),
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
            .map((vNodeHashes: IVNodeHashes): vd.VNode => {
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

        this._element$ = this._vPatch$.scan(
            (oldElement: Element, vPatch: vd.VPatch[]): Element => {
                return vd.patch(oldElement, vPatch);
            },
            rootNode)
            .shareReplay(1)
            .publish();
        this._element$.connect();
        this._element$.subscribe();
    }

    public get element$(): rx.Observable<Element> {
        return this._element$;
    }

    public get render$(): rx.Subject<any> {
        return this._render$;
    }

    public get renderAdaptable$(): rx.Subject<any> {
        return this._renderAdaptable$;
    }

    public clear(name: string): void {
        this._renderAdaptable$.onNext({name: name, vnode: null});
        this._render$.onNext({name: name, vnode: null});
    }
}

export default DOMRenderer;
