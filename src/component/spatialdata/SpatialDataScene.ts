import * as THREE from "three";

import CameraVisualizationMode from "./CameraVisualizationMode";
import { NodeData } from "./SpatialDataCache";
import IClusterReconstruction, { IReconstructionPoint } from "../../api/interfaces/IClusterReconstruction";
import { Transform } from "../../geo/Transform";
import ISpatialDataConfiguration from "../interfaces/ISpatialDataConfiguration";
import MapillaryError from "../../error/MapillaryError";

type ClusterReconstructions = {
    [key: string]: {
        tiles: string[];
        points: THREE.Object3D;
    };
}

class TransformObject3D extends THREE.Object3D {
    constructor(private _transform: Transform) {
        super();
    }

    public get transform(): Transform {
        return this._transform;
    }
}

export class SpatialDataScene {
    private _scene: THREE.Scene;
    private _raycaster: THREE.Raycaster;

    private _cameraColors: { [id: string]: string };
    private _needsRender: boolean;
    private _interactiveObjects: THREE.Object3D[];

    private _tileClusterReconstructions: {
        [hash: string]: {
            keys: string[];
        };
    };

    private _clusterReconstructions: ClusterReconstructions;

    private _nodes: {
        [hash: string]: {
            cameras: THREE.Object3D;
            cameraKeys: { [id: string]: string };
            clusters: { [id: string]: THREE.Object3D[] };
            connectedComponents: { [id: string]: THREE.Object3D[] };
            keys: string[];
            positions: THREE.Object3D;
            sequences: { [id: string]: THREE.Object3D[] };
        };
    };

    private _tiles: { [hash: string]: THREE.Object3D };

    private _cameraVisualizationMode: CameraVisualizationMode;
    private _cameraSize: number;
    private _camerasVisible: boolean;
    private _pointSize: number;
    private _pointsVisible: boolean;
    private _positionsVisible: boolean;
    private _tilesVisible: boolean;

    private readonly _latitudeVertices: number;
    private readonly _longitudeVertices: number;
    private readonly _rayNearScale: number;
    private readonly _pointSizeScale: number;
    private readonly _cameraSizeScale: number;

    constructor(configuration: ISpatialDataConfiguration, scene?: THREE.Scene, raycaster?: THREE.Raycaster) {
        this._rayNearScale = 1.1;

        this._scene = !!scene ? scene : new THREE.Scene();
        const near = this._rayNearScale * this._cameraSizeScale * configuration.cameraSize;
        const far = 3000;
        this._raycaster = !!raycaster ?
            raycaster :
            new THREE.Raycaster(
                undefined,
                undefined,
                near,
                far);
        this._raycaster.params.Line.threshold = 0.2;

        this._cameraColors = {};
        this._needsRender = false;
        this._interactiveObjects = [];
        this._nodes = {};
        this._tiles = {};
        this._tileClusterReconstructions = {};
        this._clusterReconstructions = {};

        this._cameraVisualizationMode = !!configuration.cameraVisualizationMode ?
            configuration.cameraVisualizationMode :
            CameraVisualizationMode.Default;

        if (this._cameraVisualizationMode === CameraVisualizationMode.Default &&
            configuration.connectedComponents === true) {
            this._cameraVisualizationMode = CameraVisualizationMode.ConnectedComponent;
        }

        this._cameraSize = configuration.cameraSize;
        this._camerasVisible = configuration.camerasVisible;
        this._pointSize = configuration.pointSize;
        this._pointsVisible = configuration.pointsVisible;
        this._positionsVisible = configuration.positionsVisible;
        this._tilesVisible = configuration.tilesVisible;

        this._latitudeVertices = 10;
        this._longitudeVertices = 6;
        this._pointSizeScale = 2;
        this._cameraSizeScale = 2;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public addClusterReconstruction(
        reconstruction: IClusterReconstruction,
        translation: number[],
        hash: string): void {

        if (this.hasClusterReconstruction(reconstruction.key, hash)) {
            return;
        }

        const key: string = reconstruction.key;

        if (!(key in this._clusterReconstructions)) {
            this._clusterReconstructions[key] = {
                points: new THREE.Object3D(),
                tiles: [],
            };

            this._clusterReconstructions[key].points.visible = this._pointsVisible;
            this._clusterReconstructions[key].points.add(
                this._createClusterPoints(
                    reconstruction,
                    translation,
                    this._pointSizeScale * this._pointSize));

            this._scene.add(
                this._clusterReconstructions[key].points);
        }

        if (this._clusterReconstructions[key].tiles.indexOf(hash) === -1) {
            this._clusterReconstructions[key].tiles.push(hash);
        }

        if (!(hash in this._tileClusterReconstructions)) {
            this._tileClusterReconstructions[hash] = {
                keys: [],
            };
        }

        if (this._tileClusterReconstructions[hash].keys.indexOf(key) === -1) {
            this._tileClusterReconstructions[hash].keys.push(key);
        }

        this._needsRender = true;
    }

    public addNode(
        data: NodeData,
        transform: Transform,
        originalPosition: number[],
        hash: string): void {
        const key: string = data.key;
        const clusterKey: string = data.clusterKey;
        const sequenceKey: string = data.sequenceKey;
        const connectedComponent: string = !!data.mergeCC ? data.mergeCC.toString() : "";

        if (this.hasNode(key, hash)) {
            return;
        }

        if (!(hash in this._nodes)) {
            this._nodes[hash] = {
                cameraKeys: {},
                cameras: new THREE.Object3D(),
                clusters: {},
                connectedComponents: {},
                keys: [],
                positions: new THREE.Object3D(),
                sequences: {},
            };

            this._nodes[hash].cameras.visible = this._camerasVisible;
            this._nodes[hash].positions.visible = this._positionsVisible;

            this._scene.add(
                this._nodes[hash].cameras,
                this._nodes[hash].positions);
        }

        if (!(connectedComponent in this._nodes[hash].connectedComponents)) {
            this._nodes[hash].connectedComponents[connectedComponent] = [];
        }

        if (!(clusterKey in this._nodes[hash].clusters)) {
            this._nodes[hash].clusters[clusterKey] = [];
        }

        if (!(sequenceKey in this._nodes[hash].sequences)) {
            this._nodes[hash].sequences[sequenceKey] = [];
        }

        const depth = this._cameraSizeScale * this._cameraSize;
        const camera: TransformObject3D = this._createCamera(transform, depth);
        this._nodes[hash].cameras.add(camera);
        for (const child of camera.children) {
            this._nodes[hash].cameraKeys[child.uuid] = key;
            this._interactiveObjects.push(child);
        }

        this._nodes[hash].connectedComponents[connectedComponent].push(camera);
        this._nodes[hash].clusters[clusterKey].push(camera);
        this._nodes[hash].sequences[sequenceKey].push(camera);

        const id: string = this._getId(
            clusterKey,
            connectedComponent,
            sequenceKey,
            this._cameraVisualizationMode);

        const color: string = this._getColor(id, this._cameraVisualizationMode);
        this._setCameraColor(color, camera);

        this._nodes[hash].positions.add(this._createPosition(transform, originalPosition));

        this._nodes[hash].keys.push(key);

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
        for (const hash of Object.keys(this._tileClusterReconstructions)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            this._disposeReconstruction(hash);
        }

        for (const hash of Object.keys(this._nodes)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            this._disposeNodes(hash);
        }

        for (const hash of Object.keys(this._tiles)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            this._disposeTile(hash);
        }

        this._needsRender = true;
    }

    public hasClusterReconstruction(key: string, hash: string): boolean {
        return key in this._clusterReconstructions &&
            this._clusterReconstructions[key].tiles.indexOf(hash) !== -1;
    }

    public hasTile(hash: string): boolean {
        return hash in this._tiles;
    }

    public hasNode(key: string, hash: string): boolean {
        return hash in this._nodes && this._nodes[hash].keys.indexOf(key) !== -1;
    }

    public intersectObjects([viewportX, viewportY]: number[], camera: THREE.Camera): string {
        if (!this._camerasVisible) {
            return null;
        }

        this._raycaster.setFromCamera(new THREE.Vector2(viewportX, viewportY), camera);

        const intersects: THREE.Intersection[] =
            this._raycaster.intersectObjects(this._interactiveObjects);
        for (const intersect of intersects) {
            for (const hash in this._nodes) {
                if (!this._nodes.hasOwnProperty(hash)) {
                    continue;
                }

                if (intersect.object.uuid in this._nodes[hash].cameraKeys) {
                    return this._nodes[hash].cameraKeys[intersect.object.uuid];
                }
            }
        }

        return null;
    }

    public setCameraSize(cameraSize: number): void {
        if (Math.abs(cameraSize - this._cameraSize) < 1e-3) {
            return;
        }

        const nodes = this._nodes;
        for (const cellId in this._nodes) {
            if (!nodes.hasOwnProperty(cellId)) {
                continue;
            }

            for (const camera of nodes[cellId].cameras.children) {
                this._updateCamera(<TransformObject3D>camera, cameraSize);
            }
        }

        this._raycaster.near = this._rayNearScale * this._cameraSizeScale * cameraSize;
        this._cameraSize = cameraSize;
        this._needsRender = true;
    }

    public setCameraVisibility(visible: boolean): void {
        if (visible === this._camerasVisible) {
            return;
        }

        for (const hash in this._nodes) {
            if (!this._nodes.hasOwnProperty(hash)) {
                continue;
            }

            this._nodes[hash].cameras.visible = visible;
        }

        this._camerasVisible = visible;
        this._needsRender = true;
    }

    public setPointSize(pointSize: number): void {
        if (Math.abs(pointSize - this._pointSize) < 1e-3) {
            return;
        }

        const scale = this._pointSizeScale;
        const clusters = this._clusterReconstructions;
        for (const key in clusters) {
            if (!clusters.hasOwnProperty(key)) {
                continue;
            }

            for (const points of clusters[key].points.children) {
                const material =
                    <THREE.PointsMaterial>(<THREE.Points>points).material;
                material.size = scale * pointSize;
                material.needsUpdate = true;
            }
        }

        this._pointSize = pointSize;
        this._needsRender = true;
    }

    public setPointVisibility(visible: boolean): void {
        if (visible === this._pointsVisible) {
            return;
        }

        for (const key in this._clusterReconstructions) {
            if (!this._clusterReconstructions.hasOwnProperty(key)) {
                continue;
            }

            this._clusterReconstructions[key].points.visible = visible;
        }

        this._pointsVisible = visible;
        this._needsRender = true;

    }

    public setPositionVisibility(visible: boolean): void {
        if (visible === this._positionsVisible) {
            return;
        }

        for (const hash in this._nodes) {
            if (!this._nodes.hasOwnProperty(hash)) {
                continue;
            }

            this._nodes[hash].positions.visible = visible;
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

    public setCameraVisualizationMode(mode: CameraVisualizationMode): void {
        if (mode === this._cameraVisualizationMode) {
            return;
        }

        for (const hash in this._nodes) {
            if (!this._nodes.hasOwnProperty(hash)) {
                continue;
            }

            let cameras: { [id: number]: THREE.Object3D[] } = undefined;

            if (mode === CameraVisualizationMode.Cluster) {
                cameras = this._nodes[hash].clusters;
            } else if (mode === CameraVisualizationMode.ConnectedComponent) {
                cameras = this._nodes[hash].connectedComponents;
            } else if (mode === CameraVisualizationMode.Sequence) {
                cameras = this._nodes[hash].sequences;
            } else {
                for (const child of this._nodes[hash].cameras.children) {
                    const color: string = this._getColor("", mode);
                    this._setCameraColor(color, child);
                }

                continue;
            }

            for (const id in cameras) {
                if (!cameras.hasOwnProperty(id)) {
                    continue;
                }

                const color: string = this._getColor(id, mode);

                for (const camera of cameras[id]) {
                    this._setCameraColor(color, camera);
                }
            }
        }

        this._cameraVisualizationMode = mode;
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

    private _createAxisPositions(transform: Transform, depth: number): Float32Array {
        const north: number[] = transform.unprojectBasic([0.5, 0], depth * 1.1);
        const south: number[] = transform.unprojectBasic([0.5, 1], depth * 0.8);
        return this._arrayToFloatArray([north, south], 3);
    }

    private _createAxis(transform: Transform, depth: number): THREE.Object3D {
        const positions = this._createAxisPositions(transform, depth);
        const axis: THREE.BufferGeometry = new THREE.BufferGeometry();
        axis.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        return new THREE.Line(axis, new THREE.LineBasicMaterial());
    }

    private _createCamera(transform: Transform, depth: number): TransformObject3D {
        return !!transform.gpano ?
            this._createPanoCamera(transform, depth) :
            this._createPrespectiveCamera(transform, depth);
    }

    private _createDiagonalPositions(transform: Transform, depth: number):
        Float32Array {
        const origin: number[] = transform.unprojectBasic([0, 0], 0, true);
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

        return this._arrayToFloatArray(vertices, 3)
    }

    private _createDiagonals(transform: Transform, depth: number): THREE.Object3D {
        const diagonals: THREE.BufferGeometry = new THREE.BufferGeometry();
        const positions = this._createDiagonalPositions(transform, depth);
        diagonals.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3));

        return new THREE.LineSegments(diagonals, new THREE.LineBasicMaterial());
    }

    private _createFramePositions(transform: Transform, depth: number):
        Float32Array {
        const vertices2d: number[][] = [];
        vertices2d.push(...this._subsample([0, 1], [0, 0], 20));
        vertices2d.push(...this._subsample([0, 0], [1, 0], 20));
        vertices2d.push(...this._subsample([1, 0], [1, 1], 20));

        const vertices3d: number[][] = vertices2d
            .map(
                (basic: number[]): number[] => {
                    return transform.unprojectBasic(basic, depth, true);
                });

        return this._arrayToFloatArray(vertices3d, 3);
    }

    private _createFrame(transform: Transform, depth: number): THREE.Object3D {
        const frame: THREE.BufferGeometry = new THREE.BufferGeometry();
        const positions = this._createFramePositions(transform, depth);
        frame.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3));

        return new THREE.Line(frame, new THREE.LineBasicMaterial());
    }

    private _createLatitudePositions(
        basicY: number,
        numVertices: number,
        transform: Transform,
        depth: number): Float32Array {
        const scaledDepth = 0.8 * depth;
        const positions: Float32Array = new Float32Array((numVertices + 1) * 3);

        for (let i: number = 0; i <= numVertices; i++) {
            const position: number[] =
                transform.unprojectBasic(
                    [i / numVertices, basicY], scaledDepth);
            const index: number = 3 * i;

            positions[index + 0] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        return positions;
    }

    private _createLatitude(
        basicY: number,
        numVertices: number,
        transform: Transform,
        depth: number): THREE.Object3D {
        const positions = this._createLatitudePositions(
            basicY, numVertices, transform, depth);
        const latitude: THREE.BufferGeometry = new THREE.BufferGeometry();
        latitude.setAttribute(
            "position", new THREE.BufferAttribute(positions, 3));

        return new THREE.Line(latitude, new THREE.LineBasicMaterial());
    }

    private _createLongitudePositions(
        basicX: number,
        numVertices: number,
        transform: Transform,
        depth: number): Float32Array {
        const scaledDepth = depth * 0.8;
        const positions: Float32Array = new Float32Array((numVertices + 1) * 3);

        for (let i: number = 0; i <= numVertices; i++) {
            const position: number[] =
                transform.unprojectBasic([basicX, i / numVertices], scaledDepth);
            const index: number = 3 * i;

            positions[index + 0] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        return positions;
    }

    private _createLongitude(
        basicX: number,
        numVertices: number,
        transform: Transform,
        depth: number): THREE.Object3D {
        const positions = this._createLongitudePositions(
            basicX, numVertices, transform, depth);
        const latitude: THREE.BufferGeometry = new THREE.BufferGeometry();
        latitude.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        return new THREE.Line(latitude, new THREE.LineBasicMaterial());
    }

    private _createPanoCamera(transform: Transform, depth: number): TransformObject3D {
        const camera = new TransformObject3D(transform);
        const latV = this._latitudeVertices;
        const lonV = this._longitudeVertices;

        camera.children.push(this._createAxis(transform, depth));
        camera.children.push(this._createLatitude(0.5, latV, transform, depth));
        camera.children.push(this._createLongitude(0, lonV, transform, depth));
        camera.children.push(this._createLongitude(0.25, lonV, transform, depth));
        camera.children.push(this._createLongitude(0.5, lonV, transform, depth));
        camera.children.push(this._createLongitude(0.75, lonV, transform, depth));

        return camera;
    }

    private _createClusterPoints(
        reconstruction: IClusterReconstruction,
        translation: number[],
        pointSize: number): THREE.Object3D {
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
                .add(new THREE.Vector3().fromArray(translation));

            positions[index + 0] = point.x;
            positions[index + 1] = point.y;
            positions[index + 2] = point.z;

            const color: number[] = points[i].color;
            colors[index + 0] = color[0] / 255.0;
            colors[index + 1] = color[1] / 255.0;
            colors[index + 2] = color[2] / 255.0;
        }

        const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material: THREE.PointsMaterial = new THREE.PointsMaterial({
            size: pointSize,
            vertexColors: true,
        });

        return new THREE.Points(geometry, material);
    }

    private _createPosition(transform: Transform, originalPosition: number[]): THREE.Object3D {
        const computedPosition: number[] = transform.unprojectBasic([0, 0], 0);
        const vertices: number[][] = [originalPosition, computedPosition];
        const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(this._arrayToFloatArray(vertices, 3), 3));

        return new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({ color: new THREE.Color(1, 0, 0) }));
    }

    private _createPrespectiveCamera(transform: Transform, depth: number):
        TransformObject3D {
        const camera = new TransformObject3D(transform);

        camera.children.push(this._createDiagonals(transform, depth));
        camera.children.push(this._createFrame(transform, depth));

        return camera;
    }

    private _disposeCameras(hash: string): void {
        const tileCameras: THREE.Object3D = this._nodes[hash].cameras;

        for (const camera of tileCameras.children.slice()) {
            for (const child of camera.children) {
                (<THREE.Line>child).geometry.dispose();
                (<THREE.Material>(<THREE.Line>child).material).dispose();

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
        for (const key of this._tileClusterReconstructions[hash].keys) {
            if (!(key in this._clusterReconstructions)) {
                continue;
            }

            const index: number = this._clusterReconstructions[key].tiles.indexOf(hash);
            if (index === -1) {
                continue;
            }

            this._clusterReconstructions[key].tiles.splice(index, 1);

            if (this._clusterReconstructions[key].tiles.length > 0) {
                continue;
            }

            for (const points of this._clusterReconstructions[key].points.children.slice()) {
                (<THREE.Points>points).geometry.dispose();
                (<THREE.Material>(<THREE.Points>points).material).dispose();
            }

            this._scene.remove(this._clusterReconstructions[key].points);

            delete this._clusterReconstructions[key];
        }
    }

    private _disposePositions(hash: string): void {
        const tilePositions: THREE.Object3D = this._nodes[hash].positions;

        for (const position of tilePositions.children.slice()) {
            (<THREE.Points>position).geometry.dispose();
            (<THREE.Material>(<THREE.Points>position).material).dispose();

            tilePositions.remove(position);
        }

        this._scene.remove(tilePositions);
    }

    private _disposeNodes(hash: string): void {
        this._disposeCameras(hash);
        this._disposePositions(hash);

        delete this._nodes[hash];
    }

    private _disposeReconstruction(hash: string): void {
        this._disposePoints(hash);

        delete this._tileClusterReconstructions[hash];
    }

    private _disposeTile(hash: string): void {
        const tile: THREE.Object3D = this._tiles[hash];

        for (const line of tile.children.slice()) {
            (<THREE.Line>line).geometry.dispose();
            (<THREE.Material>(<THREE.Line>line).material).dispose();

            tile.remove(line);
        }

        this._scene.remove(tile);

        delete this._tiles[hash];
    }

    private _getColor(id: string, mode: CameraVisualizationMode): string {
        return mode !== CameraVisualizationMode.Default && id.length > 0 ?
            this._getCameraColor(id) :
            "#FFFFFF";
    }

    private _getCameraColor(id: string): string {
        if (!(id in this._cameraColors)) {
            this._cameraColors[id] = this._randomColor();
        }

        return this._cameraColors[id];
    }

    private _getId(
        clusterKey: string,
        connectedComponent: string,
        sequenceKey: string,
        mode: CameraVisualizationMode): string {
        switch (mode) {
            case CameraVisualizationMode.Cluster:
                return clusterKey;
            case CameraVisualizationMode.ConnectedComponent:
                return connectedComponent;
            case CameraVisualizationMode.Sequence:
                return sequenceKey;
            default:
                return "";
        }
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

    private _updateCamera(camera: TransformObject3D, cameraSize: number): void {
        const depth = this._cameraSizeScale * cameraSize;
        if (!!camera.transform.gpano) {
            this._updatePanoCamera(camera, depth);
        } else {
            this._updatePerspectiveCamera(camera, depth);
        }
    }

    private _updatePanoCamera(camera: TransformObject3D, depth: number): void {
        if (camera.children.length !== 6) {
            throw new MapillaryError("Not a pano camera.");
        }

        const latV = this._latitudeVertices;
        const lonV = this._longitudeVertices;

        const children = <THREE.Line[]>camera.children;
        const axis = children[0];
        const latitude = children[1];
        const longitude1 = children[2];
        const longitude2 = children[3];
        const longitude3 = children[4];
        const longitude4 = children[5];

        this._updateAxis(axis, camera.transform, depth);
        this._updateLatitude(latitude, 0.5, latV, camera.transform, depth);
        this._updateLongitude(longitude1, 0, lonV, camera.transform, depth);
        this._updateLongitude(longitude2, 0.25, lonV, camera.transform, depth);
        this._updateLongitude(longitude3, 0.5, lonV, camera.transform, depth);
        this._updateLongitude(longitude4, 0.75, lonV, camera.transform, depth);
    }

    private _updateLinePositions(
        positions: Float32Array,
        line: THREE.Line): void {
        const geometry = <THREE.BufferGeometry>line.geometry;
        const attribute = <THREE.BufferAttribute>geometry.getAttribute("position");

        attribute.set(positions);
        attribute.needsUpdate = true;

        geometry.computeBoundingSphere();
    }

    private _updateLatitude(
        latitude: THREE.Line,
        basicY: number,
        numVertices: number,
        transform: Transform,
        depth: number): void {
        const positions =
            this._createLatitudePositions(
                basicY, numVertices, transform, depth);
        this._updateLinePositions(positions, latitude);
    }

    private _updateLongitude(
        longitude: THREE.Line,
        basicX: number,
        numVertices: number,
        transform: Transform,
        depth: number): void {
        const positions =
            this._createLongitudePositions(
                basicX, numVertices, transform, depth);
        this._updateLinePositions(positions, longitude);
    }

    private _updateAxis(
        axis: THREE.Line, transform: Transform, depth: number): void {
        const positions = this._createAxisPositions(transform, depth);
        this._updateLinePositions(positions, axis);
    }

    private _updatePerspectiveCamera(
        camera: TransformObject3D,
        depth: number): void {
        if (camera.children.length !== 2) {
            throw new MapillaryError("Not a non pano camera.");
        }

        const children = <THREE.Line[]>camera.children;
        const diagonals = children[0];
        const frame = children[1];
        this._updateDiagonals(diagonals, camera.transform, depth);
        this._updateFrame(frame, camera.transform, depth);
    }

    private _updateDiagonals(
        diagonals: THREE.Line,
        transform: Transform,
        depth: number): void {
        const positions = this._createDiagonalPositions(transform, depth);
        this._updateLinePositions(positions, diagonals);
    }

    private _updateFrame(
        frame: THREE.Line,
        transform: Transform,
        depth: number): void {
        const positions = this._createFramePositions(transform, depth);
        this._updateLinePositions(positions, frame);
    }
}

export default SpatialDataScene;
