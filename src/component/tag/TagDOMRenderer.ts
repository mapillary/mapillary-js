/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";
import * as vd from "virtual-dom";

import {Tag, IActiveTag, TagLabel, TagOperation} from "../../Component";
import {ISpriteAtlas} from "../../Viewer";

export class TagDOMRenderer {
    private _activeTag$: rx.Subject<IActiveTag>;
    private _editInitiated$: rx.Subject<void>;
    private _editAbort$: rx.Subject<void>;

    constructor() {
        this._activeTag$ = new rx.Subject<IActiveTag>();
        this._editInitiated$ = new rx.Subject<void>();
        this._editAbort$ = new rx.Subject<void>();
    }

    public get activeTag$(): rx.Observable<IActiveTag> {
        return this._activeTag$;
    }

    public get editInitiated$(): rx.Observable<void> {
        return this._editInitiated$;
    }

    public get editAbort$(): rx.Observable<void> {
        return this._editAbort$;
    }

    public render(tags: Tag[], atlas: ISpriteAtlas, camera: THREE.PerspectiveCamera): vd.VNode {
        let vNodes: vd.VNode[] = [];
        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);

        for (let t of tags) {
            let tag: Tag = t;

            let bottomRightCamera: THREE.Vector3 = this._convertToCameraSpace(tag.polygonPoints3d[3], matrixWorldInverse);
            if (bottomRightCamera.z < 0) {
                let labelCanvas: number[] = this._projectToCanvas(bottomRightCamera, camera.projectionMatrix);
                let labelCss: string[] = labelCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                if (tag.label === TagLabel.Text) {
                    let properties: vd.createProperties = {
                        style: { left: labelCss[0], position: "absolute", top: labelCss[1] },
                        textContent: tag.value,
                    };

                    vNodes.push(vd.h("span.TagLabel", properties, []));
                } else if (tag.label === TagLabel.Icon) {
                    if (atlas.loaded) {
                        let sprite: vd.VNode = atlas.getDOMSprite(tag.value);
                        let properties: vd.createProperties = {
                            style: { left: labelCss[0], position: "absolute", top: labelCss[1] },
                        };

                        vNodes.push(vd.h("div", properties, [sprite]));
                    }
                }
            }

            if (!tag.editable) {
                continue;
            }

            let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._editAbort$.onNext(null);
            };

            for (let i: number = 0; i < tag.operations.length; i++) {
                let polygonPoint3d: number[] = tag.polygonPoints3d[i];
                let pointCameraSpace: THREE.Vector3 = this._convertToCameraSpace(polygonPoint3d, matrixWorldInverse);

                if (pointCameraSpace.z > 0) {
                    continue;
                }

                let cornerCanvas: number[] = this._projectToCanvas(pointCameraSpace, camera.projectionMatrix);
                let cornerCss: string[] = cornerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

                let operation: TagOperation = tag.operations[i];

                let activateResize: (e: MouseEvent) => void = this._activateTag(tag, operation);

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

    private _activateTag(tag: Tag, operation: TagOperation): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
                let offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
                let offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

                this._activeTag$.onNext({ offsetX: offsetX, offsetY: offsetY, operation: operation, tag: tag });
                this._editInitiated$.onNext(null);
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
