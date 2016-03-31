/// <reference path="../../typings/browser.d.ts" />

import * as THREE from "three";

import {IGPano} from "../API";
import {Node} from "../Graph";
import {GeoCoords, ILatLonAlt, Spatial} from "../Geo";

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

    public static fromNodeAndReference(node: Node, reference: ILatLonAlt) {
        let translation: number[] = Transform._nodeToTranslation(node, reference);
        return new Transform(node, translation);
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

    private static _nodeToTranslation(node: Node, reference: ILatLonAlt): number[] {
        let C: number[] = (new GeoCoords).geodeticToEnu(
            node.latLon.lat,
            node.latLon.lon,
            node.apiNavImIm.calt,
            reference.lat,
            reference.lon,
            reference.alt);

        let RC: THREE.Vector3 = (new Spatial).rotate(C, node.apiNavImIm.rotation);

        return [-RC.x, -RC.y, -RC.z];
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
