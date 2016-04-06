/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as rx from "rx";
import * as vd from "virtual-dom";

import {ITag} from "../../Component";

export class TagDOMRenderer {
    private _activeTag$: rx.Subject<ITag>;
    private _editInitiated$: rx.Subject<void>;
    private _editAbort$: rx.Subject<void>;

    constructor() {
        this._activeTag$ = new rx.Subject<ITag>();
        this._editInitiated$ = new rx.Subject<void>();
        this._editAbort$ = new rx.Subject<void>();
    }

    public get activeTag$(): rx.Observable<ITag> {
        return this._activeTag$;
    }

    public get editInitiated$(): rx.Observable<void> {
        return this._editInitiated$;
    }

    public get editAbort$(): rx.Observable<void> {
        return this._editAbort$;
    }

    public render(tags: ITag[], camera: THREE.PerspectiveCamera): vd.VNode {
        let vRects: vd.VNode[] = [];
        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4();
        matrixWorldInverse.getInverse(camera.matrixWorld);

        for (let t of tags) {
            let tag: ITag = t;

            let topLeftCamera: THREE.Vector3 = this._convertToCameraSpace(tag.polygon3d[1], matrixWorldInverse);
            let bottomRightCamera: THREE.Vector3 = this._convertToCameraSpace(tag.polygon3d[3], matrixWorldInverse);

            if (topLeftCamera.z > 0 && bottomRightCamera.z > 0) {
                continue;
            }

            let topLeft: number[] = this._projectToCanvas(topLeftCamera, camera.projectionMatrix);
            let bottomRight: number[] = this._projectToCanvas(bottomRightCamera, camera.projectionMatrix);

            let rect: number[] = [];
            rect[0] = topLeft[0];
            rect[1] = topLeft[1];
            rect[2] = bottomRight[0];
            rect[3] = bottomRight[1];

            let adjustedRect: number[] = this._coordsToCss(rect);

            let rectMapped: string[] = adjustedRect.map((el: number) => {
                return (el * 100) + "%";
            });

            let activateTag: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._activeTag$.onNext(tag);
                this._editInitiated$.onNext(null);
            };

            let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._editAbort$.onNext(null);
            };

            let resize: vd.VNode = vd.h(
                "div",
                {
                    onmousedown: activateTag,
                    onmouseup: abort,
                    style: {
                        background: "red",
                        height: "20px",
                        left: "-20px",
                        position: "absolute",
                        top: "-20px",
                        width: "20px",
                    },
                },
                []);

            let label: vd.VNode = vd.h("span", { style: { color: "red" }, textContent: tag.value }, []);

            vRects.push(vd.h("div.TagRect", { style: this._getRectStyle(rectMapped) }, [resize, label]));
        }

        return vd.h("div.TagContainer", {}, vRects);
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

    private _coordsToCss(rects: number[]): number[] {
        let adjustedCoords: number[] = rects.concat();
        adjustedCoords[2] = 1 - adjustedCoords[2];
        adjustedCoords[3] = 1 - adjustedCoords[3];
        return adjustedCoords;
    }

    private _getRectStyle(mappedRect: Array<string>): string {
        return `top:${mappedRect[1]}; bottom:${mappedRect[3]}; right:${mappedRect[2]}; left:${mappedRect[0]}`;
    }
}
