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
        let vRects: vd.VNode[] = [];
        let vMovers: vd.VNode[] = [];
        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4();
        matrixWorldInverse.getInverse(camera.matrixWorld);

        for (let t of tags) {
            let tag: Tag = t;

            let topLeftCamera: THREE.Vector3 = this._convertToCameraSpace(tag.rectPoints3d[1], matrixWorldInverse);
            let bottomRightCamera: THREE.Vector3 = this._convertToCameraSpace(tag.rectPoints3d[3], matrixWorldInverse);

            if (topLeftCamera.z > 0 && bottomRightCamera.z > 0) {
                continue;
            }

            let topLeft: number[] = this._projectToCanvas(topLeftCamera, camera.projectionMatrix);
            let bottomRight: number[] = this._projectToCanvas(bottomRightCamera, camera.projectionMatrix);

            let canvasRect: number[] = [
                topLeft[0], topLeft[1], bottomRight[0], bottomRight[1],
            ];

            let activateResize: (e: MouseEvent) => void = this._activateTag(tag, TagOperation.ResizeTopLeft);
            let activateMove: (e: MouseEvent) => void = this._activateTag(tag, TagOperation.Move);

            let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._editAbort$.onNext(null);
            };

            let centerCamera: THREE.Vector3 = this._convertToCameraSpace(tag.centroidPoint3d, matrixWorldInverse);
            let centerCanvas: number[] = this._projectToCanvas(centerCamera, camera.projectionMatrix);
            let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });
            let moveStyle: any = {
                left: centerCss[0],
                top: centerCss[1],
            };

            let resize: vd.VNode = vd.h("div.TagResizer", { onmousedown: activateResize, onmouseup: abort }, []);
            let label: vd.VNode = vd.h("span.TagLabel", { textContent: tag.value }, []);

            vRects.push(vd.h("div.TagRect", { style: this._canvasToCss(canvasRect) }, [resize, label]));

            vMovers.push(vd.h("div.TagMover", { onmousedown: activateMove, onmouseup: abort, style: moveStyle }, []));
        }

        return vd.h("div.TagContainer", {}, vRects.concat(vMovers));
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

    private _canvasToCss(canvasRect: number[]): vd.createProperties {
        let margins: number[] = [];

        margins[0] = canvasRect[0];
        margins[1] = canvasRect[1];
        margins[2] = 1 - canvasRect[2];
        margins[3] = 1 - canvasRect[3];

        let percentageMargins: string[] = margins
            .map((margin: number) => {
                return (100 * margin) + "%";
            });

        let style: vd.createProperties = {
            bottom: percentageMargins[3],
            left: percentageMargins[0],
            right: percentageMargins[2],
            top: percentageMargins[1],
        };

        return style;
    }
}
