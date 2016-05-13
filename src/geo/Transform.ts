/// <reference path="../../typings/browser.d.ts" />

import * as THREE from "three";

import {IGPano} from "../API";
import {Node} from "../Graph";

export class Transform {
    private _width: number;
    private _height: number;
    private _focal: number;
    private _orientation: number;
    private _scale: number;
    private _aspect: number;

    private _gpano: IGPano;

    private _rt: THREE.Matrix4;
    private _srt: THREE.Matrix4;

    constructor(node: Node, translation: number[]) {
        this._width = this._getValue(node.apiNavImIm.width, 4);
        this._height = this._getValue(node.apiNavImIm.height, 3);
        this._focal = this._getValue(node.apiNavImIm.cfocal, 1);
        this._orientation = this._getValue(node.apiNavImIm.orientation, 1);
        this._scale = this._getValue(node.apiNavImIm.atomic_scale, 1);
        this._aspect = this._orientation < 5 ?
            this._width / this._height :
            this._height / this._width;

        this._gpano = node.apiNavImIm.gpano ? node.apiNavImIm.gpano : null;

        this._rt = this._getRt(node, translation);
        this._srt = this._getSrt(this._rt, this._scale);
    }

    public get width(): number {
        return this._width;
    }

    public get height(): number {
        return this._height;
    }

    public get focal(): number {
        return this._focal;
    }

    public get orientation(): number {
        return this._orientation;
    }

    public get scale(): number {
        return this._scale;
    }

    public get aspect(): number {
        return this._aspect;
    }

    public get gpano(): IGPano {
        return this._gpano;
    }

    public get rt(): THREE.Matrix4 {
        return this._rt;
    }

    public get srt(): THREE.Matrix4 {
        return this._srt;
    }

    public pixelToVertex(x: number, y: number, depth: number): THREE.Vector3 {
        let v: THREE.Vector4 = new THREE.Vector4(
            x / this._focal * depth,
            y / this._focal * depth,
            depth,
            1);

        v.applyMatrix4(new THREE.Matrix4().getInverse(this._rt));

        return new THREE.Vector3(v.x / v.w, v.y / v.w, v.z / v.w);
    }

    public upVector(): THREE.Vector3 {
        let rte: Float32Array = this._rt.elements;

        switch (this._orientation) {
            case 1:
                return new THREE.Vector3(-rte[1], -rte[5], -rte[9]);
            case 3:
                return new THREE.Vector3(rte[1],  rte[5],  rte[9]);
            case 6:
                return new THREE.Vector3(-rte[0], -rte[4], -rte[8]);
            case 8:
                return new THREE.Vector3(rte[0],  rte[4],  rte[8]);
            default:
                return new THREE.Vector3(-rte[1], -rte[5], -rte[9]);
        }
    }

    public projectorMatrix(): THREE.Matrix4 {
        let projector: THREE.Matrix4 = this._normalizedToTextureMatrix();

        let f: number = this._focal;
        let projection: THREE.Matrix4 = new THREE.Matrix4().set(
            f, 0, 0, 0,
            0, f, 0, 0,
            0, 0, 0, 0,
            0, 0, 1, 0
        );

        projector.multiply(projection);
        projector.multiply(this._rt);

        return projector;
    }

    public projectBasic(point: number[]): number[] {
        let sfm: number[] = this.projectSfM(point);
        return this._sfmToBasic(sfm);
    }

    public unprojectBasic(pixel: number[], distance: number): number[] {
        let sfm: number[] = this._basicToSfm(pixel);
        return this.unprojectSfM(sfm, distance);
    }

    public projectSfM(point: number[]): number[] {
        let v: THREE.Vector4 = new THREE.Vector4(point[0], point[1], point[2], 1);
        v.applyMatrix4(this._rt);
        return this._bearingToPixel([v.x, v.y, v.z]);
    }

    public unprojectSfM(pixel: number[], distance: number): number[] {
        let bearing: number[] = this._pixelToBearing(pixel);
        let v: THREE.Vector4 = new THREE.Vector4(
            distance * bearing[0],
            distance * bearing[1],
            distance * bearing[2],
            1);
        v.applyMatrix4(new THREE.Matrix4().getInverse(this._rt));
        return [v.x / v.w, v.y / v.w, v.z / v.w];
    }

    private _pixelToBearing(pixel: number[]): number[] {
        if (this._gpano) {
            let lon: number = pixel[0] * 2 * Math.PI;
            let lat: number = -pixel[1] * 2 * Math.PI;
            let x: number = Math.cos(lat) * Math.sin(lon);
            let y: number = -Math.sin(lat);
            let z: number = Math.cos(lat) * Math.cos(lon);
            return [x, y, z];
        } else {
            let v: THREE.Vector3 = new THREE.Vector3(pixel[0], pixel[1], this._focal);
            v.normalize();
            return [v.x, v.y, v.z];
        }
    }

    private _bearingToPixel(bearing: number[]): number[] {
        if (this._gpano) {
            let x: number = bearing[0];
            let y: number = bearing[1];
            let z: number = bearing[2];
            let lon: number = Math.atan2(x, z);
            let lat: number = Math.atan2(-y, Math.sqrt(x * x + z * z));
            return [lon / (2 * Math.PI), -lat / (2 * Math.PI)];
        } else {
            return [
                bearing[0] * this._focal / bearing[2],
                bearing[1] * this._focal / bearing[2],
            ];
        }
    }

    private _basicToSfm(point: number[]): number[] {
        let rotatedX: number;
        let rotatedY: number;
        switch (this._orientation) {
            case 1:
                rotatedX = point[0];
                rotatedY = point[1];
                break;
            case 3:
                rotatedX = 1 - point[0];
                rotatedY = 1 - point[1];
                break;
            case 6:
                rotatedX = point[1];
                rotatedY = 1 - point[0];
                break;
            case 8:
                rotatedX = 1 - point[1];
                rotatedY = point[0];
                break;
            default:
                rotatedX = point[0];
                rotatedY = point[1];
                break;
        }
        let w: number = this._width;
        let h: number = this._height;
        let s: number = Math.max(w, h);
        let sfmX: number = rotatedX * w / s - w / s / 2;
        let sfmY: number = rotatedY * h / s - h / s / 2;
        return [sfmX, sfmY];
    }

    private _sfmToBasic(point: number[]): number[] {
        let w: number = this._width;
        let h: number = this._height;
        let s: number = Math.max(w, h);
        let rotatedX: number = (point[0] + w / s / 2) / w * s;
        let rotatedY: number = (point[1] + h / s / 2) / h * s;

        let basicX: number;
        let basicY: number;
        switch (this._orientation) {
            case 1:
                basicX = rotatedX;
                basicY = rotatedY;
                break;
            case 3:
                basicX = 1 - rotatedX;
                basicY = 1 - rotatedY;
                break;
            case 6:
                basicY = rotatedX;
                basicX = 1 - rotatedY;
                break;
            case 8:
                basicY = 1 - rotatedX;
                basicX = rotatedY;
                break;
            default:
                basicX = rotatedX;
                basicY = rotatedY;
                break;
        }
        return [basicX, basicY];
    }

    private _getValue(value: number, fallback: number): number {
        return value != null && value > 0 ? value : fallback;
    }

    private _getRt(node: Node, translation: number[]): THREE.Matrix4 {
        let axis: THREE.Vector3 = new THREE.Vector3(
            node.apiNavImIm.rotation[0],
            node.apiNavImIm.rotation[1],
            node.apiNavImIm.rotation[2]);

        let angle: number = axis.length();
        axis.normalize();
        let rt: THREE.Matrix4 = new THREE.Matrix4();
        rt.makeRotationAxis(axis, angle);
        rt.setPosition(
            new THREE.Vector3(
                translation[0],
                translation[1],
                translation[2]));

        return rt;
    }

    private _getSrt(rt: THREE.Matrix4, scale: number): THREE.Matrix4 {
        let srt: THREE.Matrix4 = rt.clone();
        let elements: Float32Array = srt.elements;

        elements[12] = scale * elements[12];
        elements[13] = scale * elements[13];
        elements[14] = scale * elements[14];

        srt.scale(new THREE.Vector3(scale, scale, scale));

        return srt;
    }

    private _normalizedToTextureMatrix(): THREE.Matrix4 {
        let size: number = Math.max(this._width, this._height);
        let w: number = size / this._width;
        let h: number = size / this._height;
        switch (this._orientation) {
            case 1:
                return new THREE.Matrix4().set(w, 0, 0, 0.5, 0, -h, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
            case 3:
                return new THREE.Matrix4().set(-w, 0, 0, 0.5, 0, h, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
            case 6:
                return new THREE.Matrix4().set( 0, -h, 0, 0.5, -w, 0, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
            case 8:
                return new THREE.Matrix4().set(0, h, 0, 0.5, w, 0, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
            default:
                return new THREE.Matrix4().set(w, 0, 0, 0.5, 0, -h, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1);
        }
    }
}
