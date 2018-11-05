import * as THREE from "three";

import {
    IReconstruction,
    IReconstructionPoint,
    ISpatialDataConfiguration,
} from "../../Component";
import {
    Transform,
} from "../../Geo";

export class SpatialDataScene {
    private _scene: THREE.Scene;
    private _raycaster: THREE.Raycaster;

    private _connectedComponentColors: { [id: string]: string };
    private _needsRender: boolean;
    private _interactiveObjects: THREE.Object3D[];
    private _reconstructions: {
        [hash: string]: {
            cameraKeys: { [id: string]: string };
            cameras: THREE.Object3D;
            connectedComponents: { [id: string]: THREE.Object3D[] };
            keys: string[];
            points: THREE.Object3D;
            positions: THREE.Object3D;
        };
    };

    private _tiles: { [hash: string]: THREE.Object3D };

    private _camerasVisible: boolean;
    private _pointsVisible: boolean;
    private _positionsVisible: boolean;
    private _tilesVisible: boolean;
    private _visualizeConnectedComponents: boolean;

    constructor(configuration: ISpatialDataConfiguration, scene?: THREE.Scene, raycaster?: THREE.Raycaster) {
        this._scene = !!scene ? scene : new THREE.Scene();
        this._raycaster = !!raycaster ? raycaster : new THREE.Raycaster(undefined, undefined, 0.8);

        this._connectedComponentColors = {};
        this._needsRender = false;
        this._interactiveObjects = [];
        this._reconstructions = {};
        this._tiles = {};

        this._camerasVisible = configuration.camerasVisible;
        this._pointsVisible = configuration.pointsVisible;
        this._positionsVisible = configuration.positionsVisible;
        this._tilesVisible = configuration.tilesVisible;
        this._visualizeConnectedComponents = configuration.connectedComponents;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public addReconstruction(
        reconstruction: IReconstruction,
        transform: Transform,
        originalPosition: number[],
        connectedComponent: string,
        hash: string): void {

        if (!(hash in this._reconstructions)) {
            this._reconstructions[hash] = {
                cameraKeys: {},
                cameras: new THREE.Object3D(),
                connectedComponents: {},
                keys: [],
                points: new THREE.Object3D(),
                positions: new THREE.Object3D(),
            };

            this._reconstructions[hash].cameras.visible = this._camerasVisible;
            this._reconstructions[hash].points.visible = this._pointsVisible;
            this._reconstructions[hash].positions.visible = this._positionsVisible;

            this._scene.add(
                this._reconstructions[hash].cameras,
                this._reconstructions[hash].points,
                this._reconstructions[hash].positions);
        }

        if (!(connectedComponent in this._reconstructions[hash].connectedComponents)) {
            this._reconstructions[hash].connectedComponents[connectedComponent] = [];
        }

        if (transform.hasValidScale) {
            this._reconstructions[hash].points.add(this._createPoints(reconstruction, transform));
        }

        const camera: THREE.Object3D = this._createCamera(transform);
        this._reconstructions[hash].cameras.add(camera);
        for (const child of camera.children) {
            this._reconstructions[hash].cameraKeys[child.uuid] = reconstruction.main_shot;
            this._interactiveObjects.push(child);
        }

        this._reconstructions[hash].connectedComponents[connectedComponent].push(camera);

        const color: string = this._getColor(connectedComponent, this._visualizeConnectedComponents);
        this._setCameraColor(color, camera);

        this._reconstructions[hash].positions.add(this._createPosition(transform, originalPosition));

        this._reconstructions[hash].keys.push(reconstruction.main_shot);

        this._needsRender = true;
    }

    public addTile(tileBBox: number[][], hash: string): void {
        if (this.hasTile(hash)) {
            return;
        }

        const sw: number[] = tileBBox[0];
        const ne: number[] = tileBBox[1];

        const geometry: THREE.Geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3().fromArray(sw),
            new THREE.Vector3(sw[0], ne[1], (sw[2] + ne[2]) / 2),
            new THREE.Vector3().fromArray(ne),
            new THREE.Vector3(ne[0], sw[1], (sw[2] + ne[2]) / 2),
            new THREE.Vector3().fromArray(sw));

        const tile: THREE.Object3D = new THREE.Line(geometry, new THREE.LineBasicMaterial());

        this._tiles[hash] = new THREE.Object3D();
        this._tiles[hash].visible = this._tilesVisible;
        this._tiles[hash].add(tile);
        this._scene.add(this._tiles[hash]);

        this._needsRender = true;
    }

    public uncache(keepHashes?: string[]): void {
        for (const hash of Object.keys(this._reconstructions)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            this._disposeReconstruction(hash);
        }

        for (const hash of Object.keys(this._tiles)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            this._disposeTile(hash);
        }

        this._needsRender = true;
    }

    public hasReconstruction(key: string, hash: string): boolean {
        return hash in this._reconstructions && this._reconstructions[hash].keys.indexOf(key) !== -1;
    }

    public hasTile(hash: string): boolean {
        return hash in this._tiles;
    }

    public intersectObjects([viewportX, viewportY]: number[], camera: THREE.Camera): string {
        if (!this._camerasVisible) {
            return null;
        }

        this._raycaster.setFromCamera(new THREE.Vector2(viewportX, viewportY), camera);

        const intersects: THREE.Intersection[] = this._raycaster.intersectObjects(this._interactiveObjects);
        for (const intersect of intersects) {
            for (const hash in this._reconstructions) {
                if (!this._reconstructions.hasOwnProperty(hash)) {
                    continue;
                }

                if (intersect.object.uuid in this._reconstructions[hash].cameraKeys) {
                    return this._reconstructions[hash].cameraKeys[intersect.object.uuid];
                }
            }
        }

        return null;
    }

    public setCameraVisibility(visible: boolean): void {
        if (visible === this._camerasVisible) {
            return;
        }

        for (const hash in this._reconstructions) {
            if (!this._reconstructions.hasOwnProperty(hash)) {
                continue;
            }

            this._reconstructions[hash].cameras.visible = visible;
        }

        this._camerasVisible = visible;
        this._needsRender = true;
    }

    public setPointVisibility(visible: boolean): void {
        if (visible === this._pointsVisible) {
            return;
        }

        for (const hash in this._reconstructions) {
            if (!this._reconstructions.hasOwnProperty(hash)) {
                continue;
            }

            this._reconstructions[hash].points.visible = visible;
        }

        this._pointsVisible = visible;
        this._needsRender = true;

    }

    public setPositionVisibility(visible: boolean): void {
        if (visible === this._positionsVisible) {
            return;
        }

        for (const hash in this._reconstructions) {
            if (!this._reconstructions.hasOwnProperty(hash)) {
                continue;
            }

            this._reconstructions[hash].positions.visible = visible;
        }

        this._positionsVisible = visible;
        this._needsRender = true;
    }

    public setTileVisibility(visible: boolean): void {
        if (visible === this._tilesVisible) {
            return;
        }

        for (const hash in this._tiles) {
            if (!this._tiles.hasOwnProperty(hash)) {
                continue;
            }

            this._tiles[hash].visible = visible;
        }

        this._tilesVisible = visible;
        this._needsRender = true;
    }

    public setConnectedComponentVisualization(visualize: boolean): void {
        if (visualize === this._visualizeConnectedComponents) {
            return;
        }

        for (const hash in this._reconstructions) {
            if (!this._reconstructions.hasOwnProperty(hash)) {
                continue;
            }

            const connectedComponents: { [id: number]: THREE.Object3D[] } =
                this._reconstructions[hash].connectedComponents;

            for (const connectedComponent in connectedComponents) {
                if (!connectedComponents.hasOwnProperty(connectedComponent)) {
                    continue;
                }

                const color: string = this._getColor(connectedComponent, visualize);

                for (const camera of connectedComponents[connectedComponent]) {
                    this._setCameraColor(color, camera);
                }
            }
        }

        this._visualizeConnectedComponents = visualize;
        this._needsRender = true;
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

    private _createAxis(transform: Transform): THREE.Object3D {
        const north: number[] = transform.unprojectBasic([0.5, 0], 0.22);
        const south: number[] = transform.unprojectBasic([0.5, 1], 0.16);

        const axis: THREE.BufferGeometry = new THREE.BufferGeometry();
        axis.addAttribute("position", new THREE.BufferAttribute(this._arrayToFloatArray([north, south], 3), 3));

        return new THREE.Line(axis, new THREE.LineBasicMaterial());
    }

    private _createCamera(transform: Transform): THREE.Object3D {
        return !!transform.gpano ?
            this._createPanoCamera(transform) :
            this._createPrespectiveCamera(transform);
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

    private _createPoints(reconstruction: IReconstruction, transform: Transform): THREE.Object3D {
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

        return new THREE.Points(geometry, material);
    }

    private _createPosition(transform: Transform, originalPosition: number[]): THREE.Object3D {
        const computedPosition: number[] = transform.unprojectBasic([0, 0], 0);
        const vertices: number[][] = [originalPosition, computedPosition];
        const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(this._arrayToFloatArray(vertices, 3), 3));

        return new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ color: new THREE.Color(1, 0, 0) }));
    }

    private _createPrespectiveCamera(transform: Transform): THREE.Object3D {
        const depth: number = 0.2;
        const camera: THREE.Object3D = new THREE.Object3D();

        camera.children.push(this._createDiagonals(transform, depth));
        camera.children.push(this._createFrame(transform, depth));

        return camera;
    }

    private _disposeCameras(hash: string): void {
        const tileCameras: THREE.Object3D = this._reconstructions[hash].cameras;

        for (const camera of tileCameras.children.slice()) {
            for (const child of camera.children) {
                (<THREE.Line>child).geometry.dispose();
                (<THREE.Line>child).material.dispose();

                const index: number = this._interactiveObjects.indexOf(child);
                if (index !== -1) {
                    this._interactiveObjects.splice(index, 1);
                } else {
                    console.warn(`Object does not exist (${child.id}) for ${hash}`);
                }
            }

            tileCameras.remove(camera);
        }

        this._scene.remove(tileCameras);
    }

    private _disposePoints(hash: string): void {
        const tilePoints: THREE.Object3D = this._reconstructions[hash].points;

        for (const points of tilePoints.children.slice()) {
            (<THREE.Points>points).geometry.dispose();
            (<THREE.Points>points).material.dispose();

            tilePoints.remove(points);
        }

        this._scene.remove(tilePoints);
    }

    private _disposePositions(hash: string): void {
        const tilePositions: THREE.Object3D = this._reconstructions[hash].positions;

        for (const position of tilePositions.children.slice()) {
            (<THREE.Points>position).geometry.dispose();
            (<THREE.Points>position).material.dispose();

            tilePositions.remove(position);
        }

        this._scene.remove(tilePositions);
    }

    private _disposeReconstruction(hash: string): void {
        this._disposeCameras(hash);
        this._disposePoints(hash);
        this._disposePositions(hash);

        delete this._reconstructions[hash];
    }

    private _disposeTile(hash: string): void {
        const tile: THREE.Object3D = this._tiles[hash];

        for (const line of tile.children.slice()) {
            (<THREE.Line>line).geometry.dispose();
            (<THREE.Line>line).material.dispose();

            tile.remove(line);
        }

        this._scene.remove(tile);

        delete this._tiles[hash];
    }

    private _getColor(connectedComponent: string, visualizeConnectedComponents: boolean): string {
        return visualizeConnectedComponents ?
            this._getConnectedComponentColor(connectedComponent) :
            "#FFFFFF";
    }

    private _getConnectedComponentColor(connectedComponent: string): string {
        if (!(connectedComponent in this._connectedComponentColors)) {
            this._connectedComponentColors[connectedComponent] = this._randomColor();
        }

        return this._connectedComponentColors[connectedComponent];
    }

    private _interpolate(a: number, b: number, alpha: number): number {
        return a + alpha * (b - a);
    }

    private _randomColor(): string {
        return `hsl(${Math.floor(360 * Math.random())}, 100%, 65%)`;
    }

    private _setCameraColor(color: string, camera: THREE.Object3D): void {
        for (const child of camera.children) {
            (<THREE.LineBasicMaterial>(<THREE.Line>child).material).color = new THREE.Color(color);
        }
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
