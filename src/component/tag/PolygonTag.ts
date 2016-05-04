/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {IPolygonTagOptions, TagBase, TagLabelKind, TagOperation} from "../../Component";
import {Transform} from "../../Geo";
import {ISpriteAtlas} from "../../Viewer";

export class PolygonTag extends TagBase {
    private _label: string;
    private _labelKind: TagLabelKind;
    private _editable: boolean;

    private _polygon: number[][];

    constructor(id: string, tag: IPolygonTagOptions) {
        super(id);

        this._polygon = [];

        this._label = tag.label;
        this._labelKind = tag.labelKind;
        this._editable = tag.editable;

        for (let point of tag.polygon) {
            this._polygon.push(point.slice());
        }
    }

    public get polygon(): number[][] {
        return this._polygon;
    }

    public set polygon(value: number[][]) {
        this._polygon = value;

        this._notifyChanged$.onNext(this);
    }

    public get label(): string {
        return this._label;
    }

    public get labelKind(): TagLabelKind {
        return this._labelKind;
    }

    public get editable(): boolean {
        return this._editable;
    }

    public setPolygonPoint2d(index: number, value: number[]): void {
        if (index === 0 || index === this._polygon.length - 1) {
            this._polygon[0] = value.slice();
            this._polygon[this._polygon.length - 1] = value.slice();
        } else {
            this._polygon[index] = value.slice();
        }

        this._notifyChanged$.onNext(this);
    }

    public setCentroid2d(value: number[]): void {
        let xs: number[] = this._polygon.map((point: number[]): number => { return point[0]; });
        let ys: number[] = this._polygon.map((point: number[]): number => { return point[1]; });

        let minX: number = Math.min.apply(Math, xs);
        let maxX: number = Math.max.apply(Math, xs);
        let minY: number = Math.min.apply(Math, ys);
        let maxY: number = Math.max.apply(Math, ys);

        let centroid: number[] = this._getCentroid2d();

        let minTranslationX: number = -minX;
        let maxTranslationX: number = 1 - maxX;
        let minTranslationY: number = -minY;
        let maxTranslationY: number = 1 - maxY;

        let translationX: number = Math.max(minTranslationX, Math.min(maxTranslationX, value[0] - centroid[0]));
        let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, value[1] - centroid[1]));

        for (let point of this._polygon) {
            point[0] += translationX;
            point[1] += translationY;
        }

        this._notifyChanged$.onNext(this);
    }

    public getPoint3d(x: number, y: number, transform: Transform): number[] {
        return transform.unprojectBasic([x, y], 200);
    }

    public getPolygonPoints3d(transform: Transform): number[][] {
        return this._polygon
            .map(
                (point: number[]) => {
                    return this.getPoint3d(point[0], point[1], transform);
                });
    }

    public getCentroidPoint3d(transform: Transform): number[] {
        let centroid: number[] = this._getCentroid2d();

        return this.getPoint3d(centroid[0], centroid[1], transform);
    }

    public getGLGeometry(transform: Transform): THREE.Object3D {
        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        let sides: number = this._polygon.length - 1;
        let sections: number = 8;

        let positions: Float32Array = new Float32Array(sides * sections * 3);

        for (let i: number = 0; i < sides; ++i) {
            let startX: number = this._polygon[i][0];
            let startY: number = this._polygon[i][1];

            let endX: number = this._polygon[i + 1][0];
            let endY: number = this._polygon[i + 1][1];

            let intervalX: number = (endX - startX) / (sections - 1);
            let intervalY: number = (endY - startY) / (sections - 1);

            for (let j: number = 0; j < sections; ++j) {
                let rectPosition: number[] = [
                    startX + j * intervalX,
                    startY + j * intervalY,
                ];

                let position: number[] = this.getPoint3d(rectPosition[0], rectPosition[1], transform);
                let index: number = 3 * sections * i + 3 * j;

                positions[index] = position[0];
                positions[index + 1] = position[1];
                positions[index + 2] = position[2];
            }
        }

        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        let material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 1 } );
        let line: THREE.Line = new THREE.Line(geometry, material);

        return line;
    }

    public getDOMGeometry(atlas: ISpriteAtlas, camera: THREE.PerspectiveCamera, transform: Transform): vd.VNode[] {
        let vNodes: vd.VNode[] = [];
        let matrixWorldInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(camera.matrixWorld);

        if (!this._editable) {
            return vNodes;
        }

        let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            this._interactionAbort$.onNext(this._id);
        };

        let polygonPoints3d: number[][] = this.getPolygonPoints3d(transform);

        for (let i: number = 0; i < polygonPoints3d.length - 1; i++) {
            let polygonPoint3d: number[] = polygonPoints3d[i];
            let pointCameraSpace: THREE.Vector3 = this._convertToCameraSpace(polygonPoint3d, matrixWorldInverse);

            if (pointCameraSpace.z > 0) {
                continue;
            }

            let cornerCanvas: number[] = this._projectToCanvas(pointCameraSpace, camera.projectionMatrix);
            let cornerCss: string[] = cornerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let activateResize: (e: MouseEvent) => void = this._activateTag(this, TagOperation.Resize, i);

            let properties: vd.createProperties = {
                onmousedown: activateResize,
                onmouseup: abort,
                style: { left: cornerCss[0], top: cornerCss[1] },
            };

            vNodes.push(vd.h("div.TagResizer", properties, []));
        }

        let centerCamera: THREE.Vector3 = this._convertToCameraSpace(this.getCentroidPoint3d(transform), matrixWorldInverse);
        if (centerCamera.z < 0) {
            let centerCanvas: number[] = this._projectToCanvas(centerCamera, camera.projectionMatrix);
            let centerCss: string[] = centerCanvas.map((coord: number): string => { return (100 * coord) + "%"; });

            let activateMove: (e: MouseEvent) => void = this._activateTag(this, TagOperation.Move);

            let properties: vd.createProperties = {
                onmousedown: activateMove,
                onmouseup: abort,
                style: { left: centerCss[0], top: centerCss[1] },
            };

            vNodes.push(vd.h("div.TagMover", properties, []));
        }

        return vNodes;
    }

    private _activateTag(tag: TagBase, operation: TagOperation, resizeIndex?: number): (e: MouseEvent) => void {
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

    private _getCentroid2d(): number[] {
        let polygon: number[][] = this._polygon;

        let area: number = 0;
        let centroidX: number = 0;
        let centroidY: number = 0;

        for (let i: number = 0; i < polygon.length - 1; i++) {
            let xi: number = polygon[i][0];
            let yi: number = polygon[i][1];
            let xi1: number = polygon[i + 1][0];
            let yi1: number = polygon[i + 1][1];

            let a: number = xi * yi1 - xi1 * yi;

            area += a;
            centroidX += (xi + xi1) * a;
            centroidY += (yi + yi1) * a;
        }

        area /= 2;

        centroidX /= 6 * area;
        centroidY /= 6 * area;

        return [centroidX, centroidY];
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
