/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";
import * as vd from "virtual-dom";

import {Tag, IActiveTag, TagOperation} from "../../Component";

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

    public render(tags: Tag[], camera: THREE.PerspectiveCamera): vd.VNode {
        let vNodes: vd.VNode[] = [];
        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);

        for (let t of tags) {
            let tag: Tag = t;

            let bottomLeftCamera: THREE.Vector3 = this._convertToCameraSpace(tag.rectPoints3d[0], matrixWorldInverse);
            let topLeftCamera: THREE.Vector3 = this._convertToCameraSpace(tag.rectPoints3d[1], matrixWorldInverse);
            let topRightCamera: THREE.Vector3 = this._convertToCameraSpace(tag.rectPoints3d[2], matrixWorldInverse);
            let bottomRightCamera: THREE.Vector3 = this._convertToCameraSpace(tag.rectPoints3d[3], matrixWorldInverse);

            if (topLeftCamera.z > 0 && bottomRightCamera.z > 0) {
                continue;
            }

            let corners: [THREE.Vector3, TagOperation][] = [
                [bottomLeftCamera, TagOperation.ResizeBottomLeft],
                [topLeftCamera, TagOperation.ResizeTopLeft],
                [topRightCamera, TagOperation.ResizeTopRight],
                [bottomRightCamera, TagOperation.ResizeBottomRight],
            ];

            let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._editAbort$.onNext(null);
            };

            for (let corner of corners) {
                let pointCamera: THREE.Vector3 = corner[0];
                let operation: TagOperation = corner[1];

                let cornerCanvas: number[] = this._projectToCanvas(pointCamera, camera.projectionMatrix);
                let cornerCss: string[] = cornerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });
                let cornerStyle: any = { left: cornerCss[0], top: cornerCss[1] };

                let activateResize: (e: MouseEvent) => void = this._activateTag(tag, operation);

                vNodes.push(vd.h("div.TagResizer", { onmousedown: activateResize, onmouseup: abort, style: cornerStyle }, []));
            }

            let centerCamera: THREE.Vector3 = this._convertToCameraSpace(tag.centroidPoint3d, matrixWorldInverse);
            let centerCanvas: number[] = this._projectToCanvas(centerCamera, camera.projectionMatrix);
            let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });
            let moveStyle: any = { left: centerCss[0], top: centerCss[1] };

            let activateMove: (e: MouseEvent) => void = this._activateTag(tag, TagOperation.Move);

            vNodes.push(vd.h("div.TagMover", { onmousedown: activateMove, onmouseup: abort, style: moveStyle }, []));

            let labelCanvas: number[] = this._projectToCanvas(bottomRightCamera, camera.projectionMatrix);
            let labelCss: string[] = labelCanvas.map((coord: number): string => { return (100 * coord) + "%"; });
            let labelStyle: any = { left: labelCss[0], top: labelCss[1] };

            vNodes.push(vd.h("span.TagLabel", { style: labelStyle, textContent: tag.value }, []));
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
