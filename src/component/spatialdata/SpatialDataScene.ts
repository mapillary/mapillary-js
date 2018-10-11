import * as THREE from "three";

import {
    IReconstruction,
} from "../../Component";
import {
    Transform,
} from "../../Geo";
import { IReconstructionPoint } from "./interfaces/interfaces";

export class SpatialDataScene {
    private _needsRender: boolean;
    private _scene: THREE.Scene;
    private _points: THREE.Object3D;

    constructor(scene?: THREE.Scene) {
        this._needsRender = false;
        this._scene = !!scene ? scene : new THREE.Scene();

        this._points = new THREE.Object3D();
        this._scene.add(this._points);
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public addReconstruction(reconstruction: IReconstruction, transform: Transform): void {
        const srtInverse: THREE.Matrix4 = new THREE.Matrix4().getInverse(transform.srt);
        const geometry: THREE.Geometry = new THREE.Geometry();
        const points: IReconstructionPoint[] = reconstruction.points;

        for (let id in points) {
            if (!points.hasOwnProperty(id)) {
                continue;
            }

            const coords: number[] = points[id].coordinates;
            const color: number[] = points[id].color;
            const point: THREE.Vector3 = new THREE.Vector3(coords[0], coords[1], coords[2])
                .applyMatrix4(srtInverse);

            geometry.vertices.push(point);
            geometry.colors.push(new THREE.Color(color[0] / 255.0, color[1] / 255.0, color[2] / 255.0));
        }

        const material: THREE.PointsMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: THREE.VertexColors,
        });

        this._points.add(new THREE.Points(geometry, material));

        this._needsRender = true;
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);

        this._needsRender = false;
    }
}

export default SpatialDataScene;
