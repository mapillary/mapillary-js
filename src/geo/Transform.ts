/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {IGPano} from "../API";
import {Node} from "../Graph";

export class Transform {
    public width: number;
    public height: number;
    public focal: number;
    public orientation: number;
    public scale: number;

    public gpano: IGPano;

    public rt: THREE.Matrix4;
    public srt: THREE.Matrix4;

    constructor(node: Node) {
        this.width = this.getValue(node.apiNavImIm.width, 4);
        this.height = this.getValue(node.apiNavImIm.height, 3);
        this.focal = this.getValue(node.apiNavImIm.cfocal, 1);
        this.orientation = this.getValue(node.apiNavImIm.orientation, 1);
        this.scale = this.getValue(node.apiNavImIm.atomic_scale, 1);

        this.gpano = node.apiNavImIm.gpano ? node.apiNavImIm.gpano : null;

        this.rt = this.getRt(node);
        this.srt = this.getSrt(this.rt, this.scale);
    }

    public pixelToVertex(x: number, y: number, depth: number): THREE.Vector3 {
        let v: THREE.Vector4 = new THREE.Vector4(
            x / this.focal * depth,
            y / this.focal * depth,
            depth,
            1);

        v.applyMatrix4(new THREE.Matrix4().getInverse(this.rt));

        return new THREE.Vector3(v.x / v.w, v.y / v.w, v.z / v.w);
    }

    public upVector(): THREE.Vector3 {
        let rte: Float32Array = this.rt.elements;

        switch (this.orientation) {
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
        let projector: THREE.Matrix4 = this.normalizedToTextureMatrix();

        let f: number = this.focal;
        let projection: THREE.Matrix4 = new THREE.Matrix4().set(
            f, 0, 0, 0,
            0, f, 0, 0,
            0, 0, 0, 0,
            0, 0, 1, 0
        );

        projector.multiply(projection);
        projector.multiply(this.rt);

        return projector;
    }

    private getValue(value: number, fallback: number): number {
        return value != null && value > 0 ? value : fallback;
    }

    private getRt(node: Node): THREE.Matrix4 {
        let axis: THREE.Vector3 = new THREE.Vector3(
            node.apiNavImIm.rotation[0],
            node.apiNavImIm.rotation[1],
            node.apiNavImIm.rotation[2]);

        let angle: number = axis.length();
        axis.normalize();
        let rt: THREE.Matrix4 = new THREE.Matrix4();
        rt.makeRotationAxis(axis, angle);
        rt.setPosition(new THREE.Vector3(
            node.translation[0],
            node.translation[1],
            node.translation[2]));

        return rt;
    }

    private getSrt(rt: THREE.Matrix4, scale: number): THREE.Matrix4 {
        let srt: THREE.Matrix4 = rt.clone();
        let elements: Float32Array = srt.elements;

        elements[12] = scale * elements[12];
        elements[13] = scale * elements[13];
        elements[14] = scale * elements[14];

        srt.scale(new THREE.Vector3(scale, scale, scale));

        return srt;
    }

    private normalizedToTextureMatrix(): THREE.Matrix4 {
        let size: number = Math.max(this.width, this.height);
        let w: number = size / this.width;
        let h: number = size / this.height;
        switch (this.orientation) {
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
