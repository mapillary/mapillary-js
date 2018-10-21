import * as THREE from "three";

import {
    IReconstruction,
} from "../../Component";
import {
    Transform,
} from "../../Geo";
import { IReconstructionPoint } from "./interfaces/interfaces";

export class SpatialDataScene {
    private _scene: THREE.Scene;

    private _needsRender: boolean;
    private _points: { [hash: string]: { keys: string[]; object: THREE.Object3D; } };

    constructor(scene?: THREE.Scene) {
        this._scene = !!scene ? scene : new THREE.Scene();

        this._needsRender = false;
        this._points = {};
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public addReconstruction(reconstruction: IReconstruction, transform: Transform, hash: string): void {
        const srtInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);
        const points: IReconstructionPoint[] = Object
            .keys(reconstruction.points)
            .map(
                (key: string): IReconstructionPoint => {
                    return reconstruction.points[key];
                });

        const numPoints: number = points.length;
        const positions: Float32Array = new Float32Array(numPoints * 3);
        const colors: Float32Array = new Float32Array(numPoints * 3);

        for (let i: number = 0; i < numPoints; i++) {
            const index: number = 3 * i;

            const coords: number[] = points[i].coordinates;
            const point: THREE.Vector3 = new THREE.Vector3(coords[0], coords[1], coords[2])
                .applyMatrix4(srtInverse);

            positions[index + 0] = point.x;
            positions[index + 1] = point.y;
            positions[index + 2] = point.z;

            const color: number[] = points[i].color;
            colors[index + 0] = color[0] / 255.0;
            colors[index + 1] = color[1] / 255.0;
            colors[index + 2] = color[2] / 255.0;
        }

        const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material: THREE.PointsMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: THREE.VertexColors,
        });

        if (!(hash in this._points)) {
            this._points[hash] = {
                keys: [],
                object: new THREE.Object3D(),
            };

            this._scene.add(this._points[hash].object);
        }

        this._points[hash].object.add(new THREE.Points(geometry, material));
        this._points[hash].keys.push(reconstruction.main_shot);

        this._needsRender = true;
    }

    public hasReconstruction(key: string, hash: string): boolean {
        return hash in this._points && this._points[hash].keys.indexOf(key) !== -1;
    }

    public remove(hash: string): void {
        if (!(hash in this._points)) {
            return;
        }

        this._disposeTile(hash);
    }

    public clear(keepHashes?: string[]): void {
        for (const hash of Object.keys(this._points)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            this._disposeTile(hash);
        }
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);

        this._needsRender = false;
    }

    private _disposeTile(hash: string): void {
        const tilePoints: THREE.Object3D = this._points[hash].object;

        for (const points of tilePoints.children.slice()) {
            (<THREE.Points>points).geometry.dispose();
            (<THREE.Points>points).material.dispose();

            tilePoints.remove(points);
        }

        delete this._points[hash];
    }
}

export default SpatialDataScene;
