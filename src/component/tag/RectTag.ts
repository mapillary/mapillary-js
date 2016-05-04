/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {IRectTagOptions, TagBase, TagLabelKind, TagOperation} from "../../Component";
import {Transform} from "../../Geo";
import {ISpriteAtlas} from "../../Viewer";

export class RectTag extends TagBase {
    private _label: string;
    private _labelKind: TagLabelKind;
    private _editable: boolean;

    private _rect: number[];

    constructor(id: string, tag: IRectTagOptions) {
        super(id);

        if (tag.rect.length !== 4) {
            throw new Error("Rectangle polygon must have five points.");
        }

        this._label = tag.label;
        this._labelKind = tag.labelKind;
        this._editable = tag.editable;

        this._rect = tag.rect.slice();
    }

    public get rect(): number[] {
        return this._rect;
    }

    public set rect(value: number[]) {
        this._rect = value;

        this._notifyChanged$.onNext(this);
    }

    public get polygonPoints2d(): number[][] {
        return this._rectToPolygonPoints2d(this._rect);
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
        let original: number[] = this._rect.slice();

        let newCoord: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        let rect: number[] = [];
        if (index === 0) {
            rect[0] = newCoord[0];
            rect[1] = original[1];
            rect[2] = original[2];
            rect[3] = newCoord[1];
        } else if (index === 1) {
            rect[0] = newCoord[0];
            rect[1] = newCoord[1];
            rect[2] = original[2];
            rect[3] = original[3];
        } else if (index === 2) {
            rect[0] = original[0];
            rect[1] = newCoord[1];
            rect[2] = newCoord[0];
            rect[3] = original[3];
        } else if (index === 3) {
            rect[0] = original[0];
            rect[1] = original[1];
            rect[2] = newCoord[0];
            rect[3] = newCoord[1];
        }

        if (rect[0] > rect[2]) {
            rect[0] = original[0];
            rect[2] = original[2];
        }

        if (rect[1] > rect[3]) {
            rect[1] = original[1];
            rect[3] = original[3];
        }

        this._rect[0] = rect[0];
        this._rect[1] = rect[1];
        this._rect[2] = rect[2];
        this._rect[3] = rect[3];

        this._notifyChanged$.onNext(this);
    }

    public setCentroid2d(value: number[]): void {
        let original: number[] = this._rect.slice();

        let centerX: number = original[0] + (original[2] - original[0]) / 2;
        let centerY: number = original[1] + (original[3] - original[1]) / 2;

        let minTranslationX: number = -original[0];
        let maxTranslationX: number = 1 - original[2];
        let minTranslationY: number = -original[1];
        let maxTranslationY: number = 1 - original[3];

        let translationX: number = Math.max(minTranslationX, Math.min(maxTranslationX, value[0] - centerX));
        let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, value[1] - centerY));

        this._rect[0] = original[0] + translationX;
        this._rect[1] = original[1] + translationY;
        this._rect[2] = original[2] + translationX;
        this._rect[3] = original[3] + translationY;

        this._notifyChanged$.onNext(this);
    }

    public getPoint3d(x: number, y: number, transform: Transform): number[] {
        return transform.unprojectBasic([x, y], 200);
    }

    public getPolygonPoints3d(transform: Transform): number[][] {
        return this._rectToPolygonPoints2d(this._rect)
            .map(
                (point: number[]) => {
                    return this.getPoint3d(point[0], point[1], transform);
                });
    }

    public getCentroidPoint3d(transform: Transform): number[] {
        let rect: number[] = this._rect;

        let centroidX: number = rect[0] + (rect[2] - rect[0]) / 2;
        let centroidY: number = rect[1] + (rect[3] - rect[1]) / 2;

        return this.getPoint3d(centroidX, centroidY, transform);
    }

    public getGLGeometry(transform: Transform): THREE.Object3D {
        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        let polygonPoints2d: number[][] = this._rectToPolygonPoints2d(this._rect);

        let sides: number = polygonPoints2d.length - 1;
        let sections: number = 8;

        let positions: Float32Array = new Float32Array(sides * sections * 3);

        for (let i: number = 0; i < sides; ++i) {
            let startX: number = polygonPoints2d[i][0];
            let startY: number = polygonPoints2d[i][1];

            let endX: number = polygonPoints2d[i + 1][0];
            let endY: number = polygonPoints2d[i + 1][1];

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


        let abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            this._interactionAbort$.onNext(this._id);
        };

        let polygonPoints3d: number[][] = this.getPolygonPoints3d(transform);

        let bottomRightCamera: THREE.Vector3 = this._convertToCameraSpace(polygonPoints3d[3], matrixWorldInverse);
        if (bottomRightCamera.z < 0) {
            let labelCanvas: number[] = this._projectToCanvas(bottomRightCamera, camera.projectionMatrix);
            let labelCss: string[] = labelCanvas.map((coord: number): string => { return (100 * coord) + "%"; });
            let labelClick: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._labelClick$.onNext(this);
            };

            let activateNone: (e: MouseEvent) => void = (e: MouseEvent): void => {
                this._activeTag$.onNext({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this });
                this._interactionInitiate$.onNext(this._id);
            };

            if (this._labelKind === TagLabelKind.Text) {
                let properties: vd.createProperties = {
                    onclick: labelClick,
                    onmousedown: activateNone,
                    onmouseup: abort,
                    style: { left: labelCss[0], position: "absolute", top: labelCss[1] },
                    textContent: this._label,
                };

                vNodes.push(vd.h("span.TagLabel", properties, []));
            } else if (this._labelKind === TagLabelKind.Icon) {
                if (atlas.loaded) {
                    let sprite: vd.VNode = atlas.getDOMSprite(this._label);

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

        if (!this._editable) {
            return vNodes;
        }

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

    private _rectToPolygonPoints2d(rect: number[]): number[][] {
        return [
            [rect[0], rect[3]],
            [rect[0], rect[1]],
            [rect[2], rect[1]],
            [rect[2], rect[3]],
            [rect[0], rect[3]],
        ];
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

export default RectTag;
