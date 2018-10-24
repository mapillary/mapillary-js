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
    private _raycaster: THREE.Raycaster;

    private _needsRender: boolean;
    private _cameras: { [hash: string]: { keys: string[]; object: THREE.Object3D; } };
    private _cameraKeys: { [hash: string]: { [id: string]: string } };
    private _interactiveObjects: THREE.Object3D[];
    private _points: { [hash: string]: { keys: string[]; object: THREE.Object3D; } };

    constructor(scene?: THREE.Scene, raycaster?: THREE.Raycaster) {
        this._scene = !!scene ? scene : new THREE.Scene();
        this._raycaster = !!raycaster ? raycaster : new THREE.Raycaster(undefined, undefined, 0.8);

        this._needsRender = false;
        this._cameras = {};
        this._cameraKeys = {};
        this._interactiveObjects = [];
        this._points = {};
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public addCamera(key: string, transform: Transform, hash: string): void {
        if (!(hash in this._cameras)) {
            this._cameras[hash] = {
                keys: [],
                object: new THREE.Object3D(),
            };

            this._scene.add(this._cameras[hash].object);
        }

        const camera: THREE.Object3D = !!transform.gpano ?
            this._createPanoCamera(transform) :
            this._createRegularCamera(transform);

        this._cameras[hash].object.add(camera);
        this._cameras[hash].keys.push(key);

        if (!(hash in this._cameraKeys)) {
            this._cameraKeys[hash] = {};
        }

        for (const child of camera.children) {
            this._cameraKeys[hash][child.uuid] = key;
            this._interactiveObjects.push(child);
        }

        this._needsRender = true;
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

    public hasCamera(key: string, hash: string): boolean {
        return hash in this._cameras && this._cameras[hash].keys.indexOf(key) !== -1;
    }

    public hasReconstruction(key: string, hash: string): boolean {
        return hash in this._points && this._points[hash].keys.indexOf(key) !== -1;
    }

    public intersectObjects([viewportX, viewportY]: number[], camera: THREE.Camera): string {
        this._raycaster.setFromCamera(new THREE.Vector2(viewportX, viewportY), camera);

        const intersects: THREE.Intersection[] = this._raycaster.intersectObjects(this._interactiveObjects);
        for (const intersect of intersects) {
            for (const hash in this._cameraKeys) {
                if (!this._cameraKeys.hasOwnProperty(hash)) {
                    continue;
                }

                if (intersect.object.uuid in this._cameraKeys[hash]) {
                    return this._cameraKeys[hash][intersect.object.uuid];
                }
            }
        }

        return null;
    }

    public remove(hash: string): void {
        if (!(hash in this._points)) {
            return;
        }

        this._disposePoints(hash);
        this._disposeCameras(hash);
    }

    public clear(keepHashes?: string[]): void {
        for (const hash of Object.keys(this._points)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            this._disposePoints(hash);
        }

        for (const hash of Object.keys(this._cameras)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            this._disposeCameras(hash);
        }
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);

        this._needsRender = false;
    }

    private _arrayToFloatArray(a: number[][], columns: number): Float32Array {
        const n: number = a.length;
        const f: Float32Array = new Float32Array(n * columns);

        for (let i: number = 0; i < n; i++) {
            const item: number[] = a[i];
            const index: number = 3 * i;

            f[index + 0] = item[0];
            f[index + 1] = item[1];
            f[index + 2] = item[2];
        }

        return f;
    }

    private _createDiagonals(transform: Transform, depth: number): THREE.Object3D {
        const origin: number [] = transform.unprojectBasic([0, 0], 0, true);
        const topLeft: number[] = transform.unprojectBasic([0, 0], depth, true);
        const topRight: number[] = transform.unprojectBasic([1, 0], depth, true);
        const bottomRight: number[] = transform.unprojectBasic([1, 1], depth, true);
        const bottomLeft: number[] = transform.unprojectBasic([0, 1], depth, true);

        const vertices: number[][] = [
            origin, topLeft,
            origin, topRight,
            origin, bottomRight,
            origin, bottomLeft,
        ];

        const diagonals: THREE.BufferGeometry = new THREE.BufferGeometry();
        diagonals.addAttribute("position", new THREE.BufferAttribute(this._arrayToFloatArray(vertices, 3), 3));

        return new THREE.LineSegments(diagonals, new THREE.LineBasicMaterial());
    }

    private _createFrame(transform: Transform, depth: number): THREE.Object3D {
        const vertices2d: number[][] = [];
        vertices2d.push(...this._subsample([0, 1], [0, 0], 20));
        vertices2d.push(...this._subsample([0, 0], [1, 0], 20));
        vertices2d.push(...this._subsample([1, 0], [1, 1], 20));

        const vertices3d: number[][] = vertices2d
            .map(
                (basic: number[]): number[] => {
                    return transform.unprojectBasic(basic, depth, true);
                });

        const frame: THREE.BufferGeometry = new THREE.BufferGeometry();
        frame.addAttribute("position", new THREE.BufferAttribute(this._arrayToFloatArray(vertices3d, 3), 3));

        return new THREE.Line(frame, new THREE.LineBasicMaterial());
    }

    private _createAxis(transform: Transform): THREE.Object3D {
        const north: number[] = transform.unprojectBasic([0.5, 0], 0.22);
        const south: number[] = transform.unprojectBasic([0.5, 1], 0.16);

        const axis: THREE.BufferGeometry = new THREE.BufferGeometry();
        axis.addAttribute("position", new THREE.BufferAttribute(this._arrayToFloatArray([north, south], 3), 3));

        return new THREE.Line(axis, new THREE.LineBasicMaterial());
    }

    private _createLatitude(basicY: number, numVertices: number, transform: Transform): THREE.Object3D {
        const positions: Float32Array = new Float32Array((numVertices + 1) * 3);

        for (let i: number = 0; i <= numVertices; i++) {
            const position: number[] = transform.unprojectBasic([i / numVertices, basicY], 0.16);
            const index: number = 3 * i;

            positions[index + 0] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        const latitude: THREE.BufferGeometry = new THREE.BufferGeometry();
        latitude.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        return new THREE.Line(latitude, new THREE.LineBasicMaterial());
    }

    private _createLongitude(basicX: number, numVertices: number, transform: Transform): THREE.Object3D {
        const positions: Float32Array = new Float32Array((numVertices + 1) * 3);

        for (let i: number = 0; i <= numVertices; i++) {
            const position: number[] = transform.unprojectBasic([basicX, i / numVertices], 0.16);
            const index: number = 3 * i;

            positions[index + 0] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        const latitude: THREE.BufferGeometry = new THREE.BufferGeometry();
        latitude.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        return new THREE.Line(latitude, new THREE.LineBasicMaterial());
    }

    private _createPanoCamera(transform: Transform): THREE.Object3D {
        const camera: THREE.Object3D = new THREE.Object3D();

        camera.children.push(this._createAxis(transform));
        camera.children.push(this._createLatitude(0.5, 10, transform));
        camera.children.push(this._createLongitude(0, 6, transform));
        camera.children.push(this._createLongitude(0.25, 6, transform));
        camera.children.push(this._createLongitude(0.5, 6, transform));
        camera.children.push(this._createLongitude(0.75, 6, transform));

        return camera;
    }

    private _createRegularCamera(transform: Transform): THREE.Object3D {
        const depth: number = 0.2;
        const camera: THREE.Object3D = new THREE.Object3D();

        camera.children.push(this._createDiagonals(transform, depth));
        camera.children.push(this._createFrame(transform, depth));

        return camera;
    }

    private _disposeCameras(hash: string): void {
        const tileCameras: THREE.Object3D = this._cameras[hash].object;

        for (const camera of tileCameras.children.slice()) {
            for (const child of camera.children) {
                (<THREE.Line | THREE.LineSegments>child).geometry.dispose();
                (<THREE.Line | THREE.LineSegments>child).material.dispose();

                const index: number = this._interactiveObjects.indexOf(child);
                if (index !== -1) {
                    this._interactiveObjects.splice(index, 1);
                } else {
                    console.warn(`Object does not exist (${child.id}) for ${hash}`);
                }
            }

            tileCameras.remove(camera);
        }

        delete this._cameras[hash];
        delete this._cameraKeys[hash];
    }

    private _disposePoints(hash: string): void {
        const tilePoints: THREE.Object3D = this._points[hash].object;

        for (const points of tilePoints.children.slice()) {
            (<THREE.Points>points).geometry.dispose();
            (<THREE.Points>points).material.dispose();

            tilePoints.remove(points);
        }

        delete this._points[hash];
    }

    private _interpolate(a: number, b: number, alpha: number): number {
        return a + alpha * (b - a);
    }

    private _subsample(p1: number[], p2: number[], subsamples: number): number[][] {
        if (subsamples < 1) {
            return [p1, p2];
        }

        const samples: number[][] = [];

        for (let i: number = 0; i <= subsamples + 1; i++) {
            const p: number[] = [];

            for (let j: number = 0; j < 3; j++) {
                p.push(this._interpolate(p1[j], p2[j], i / (subsamples + 1)));
            }

            samples.push(p);
        }

        return samples;
    }
}

export default SpatialDataScene;
