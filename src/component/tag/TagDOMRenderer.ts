/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";
import * as vd from "virtual-dom";

import {Tag, IActiveTag, TagLabel, TagOperation} from "../../Component";
import {ISpriteAtlas} from "../../Viewer";

export class TagDOMRenderer {
    private _activeTag$: rx.Subject<IActiveTag>;
    private _interactionInitiate$: rx.Subject<string>;
    private _interactionAbort$: rx.Subject<string>;
    private _labelClick$: rx.Subject<Tag>;

    constructor() {
        this._activeTag$ = new rx.Subject<IActiveTag>();
        this._interactionInitiate$ = new rx.Subject<string>();
        this._interactionAbort$ = new rx.Subject<string>();
        this._labelClick$ = new rx.Subject<Tag>();
    }

    public get activeTag$(): rx.Observable<IActiveTag> {
        return this._activeTag$;
    }

    public get interactionInitiate$(): rx.Observable<string> {
        return this._interactionInitiate$;
    }

    public get interactionAbort$(): rx.Observable<string> {
        return this._interactionAbort$;
    }

    public get labelClick$(): rx.Observable<Tag> {
        return this._labelClick$;
    }

    public render(tags: Tag[], atlas: ISpriteAtlas, camera: THREE.PerspectiveCamera): vd.VNode {
        let vNodes: vd.VNode[] = [];
        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);

        for (let t of tags) {
            let tag: Tag = t;

            let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._interactionAbort$.onNext(tag.id);
            };

            let bottomRightCamera: THREE.Vector3 = this._convertToCameraSpace(tag.polygonPoints3d[3], matrixWorldInverse);
            if (bottomRightCamera.z < 0) {
                let labelCanvas: number[] = this._projectToCanvas(bottomRightCamera, camera.projectionMatrix);
                let labelCss: string[] = labelCanvas.map((coord: number): string => { return (100 * coord) + "%"; });
                let labelClick: (e: MouseEvent) => void = (e: MouseEvent): void => {
                    this._labelClick$.onNext(tag);
                };

                let activateNone: (e: MouseEvent) => void = (e: MouseEvent): void => {
                    this._activeTag$.onNext({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: tag });
                    this._interactionInitiate$.onNext(tag.id);
                };

                if (tag.label === TagLabel.Text) {
                    let properties: vd.createProperties = {
                        onclick: labelClick,
                        onmousedown: activateNone,
                        onmouseup: abort,
                        style: { left: labelCss[0], position: "absolute", top: labelCss[1] },
                        textContent: tag.value,
                    };

                    vNodes.push(vd.h("span.TagLabel", properties, []));
                } else if (tag.label === TagLabel.Icon) {
                    if (atlas.loaded) {
                        let sprite: vd.VNode = atlas.getDOMSprite(tag.value);

                        let properties: vd.createProperties = {
                            onclick: labelClick,
                            onmousedown: activateNone,
                            onmouseup: abort,
                            style: {
                                left: labelCss[0],
                                pointerEvents: "all",
                                position: "absolute",
                                top: labelCss[1],
                            },
                        };

                        vNodes.push(vd.h("div", properties, [sprite]));
                    }
                }
            }

            if (!tag.editable) {
                continue;
            }

            for (let i: number = 0; i < tag.polygonPoints3d.length - 1; i++) {
                let polygonPoint3d: number[] = tag.polygonPoints3d[i];
                let pointCameraSpace: THREE.Vector3 = this._convertToCameraSpace(polygonPoint3d, matrixWorldInverse);

                if (pointCameraSpace.z > 0) {
                    continue;
                }

                let cornerCanvas: number[] = this._projectToCanvas(pointCameraSpace, camera.projectionMatrix);
                let cornerCss: string[] = cornerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                let activateResize: (e: MouseEvent) => void = this._activateTag(tag, TagOperation.Resize, i);

                let properties: vd.createProperties = {
                    onmousedown: activateResize,
                    onmouseup: abort,
                    style: { left: cornerCss[0], top: cornerCss[1] },
                };

                vNodes.push(vd.h("div.TagResizer", properties, []));
            }

            let centerCamera: THREE.Vector3 = this._convertToCameraSpace(tag.centroidPoint3d, matrixWorldInverse);
            if (centerCamera.z < 0) {
                let centerCanvas: number[] = this._projectToCanvas(centerCamera, camera.projectionMatrix);
                let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                let activateMove: (e: MouseEvent) => void = this._activateTag(tag, TagOperation.Move);

                let properties: vd.createProperties = {
                    onmousedown: activateMove,
                    onmouseup: abort,
                    style: { left: centerCss[0], top: centerCss[1] },
                };

                vNodes.push(vd.h("div.TagMover", properties, []));
            }
        }

        return vd.h("div.TagContainer", {}, vNodes);
    }

    private _activateTag(tag: Tag, operation: TagOperation, resizeIndex?: number): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
                let offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
                let offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

                this._activeTag$.onNext({
                    offsetX: offsetX,
                    offsetY: offsetY,
                    operation: operation,
                    resizeIndex: resizeIndex,
                    tag: tag,
                });

                this._interactionInitiate$.onNext(tag.id);
        };
    }

    private _projectToCanvas(point: THREE.Vector3, projectionMatrix: THREE.Matrix4): number[] {
        let projected: THREE.Vector3 =
            new THREE.Vector3(point.x, point.y, point.z)
                .applyProjection(projectionMatrix);

        return [(projected.x + 1) / 2, (-projected.y + 1) / 2];
    }

    private _convertToCameraSpace(point: number[], matrixWorldInverse: THREE.Matrix4): THREE.Vector3 {
        let p: THREE.Vector3 = new THREE.Vector3(point[0], point[1], point[2]);
        p.applyMatrix4(matrixWorldInverse);

        return p;
    }
}
