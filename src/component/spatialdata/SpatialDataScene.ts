import * as THREE from "three";

import CameraVisualizationMode from "./CameraVisualizationMode";
import IClusterReconstruction, { IReconstructionPoint } from "../../api/interfaces/IClusterReconstruction";
import ISpatialDataConfiguration from "../interfaces/ISpatialDataConfiguration";
import MapillaryError from "../../error/MapillaryError";
import Node from "../../graph/Node";

import { FilterFunction } from "../../graph/FilterCreator";
import { Transform } from "../../geo/Transform";
import OriginalPositionMode from "./OriginalPositionMode";

type ClusterReconstructions = {
    [key: string]: {
        tiles: string[];
        points: THREE.Object3D;
    };
}

class CameraFrameLine extends THREE.Line {
    constructor(
        readonly geometry: THREE.BufferGeometry,
        readonly material: THREE.LineBasicMaterial,
        readonly frameOrigin: number[],
        readonly relativeFramePositions: number[][]) {
        super(geometry, material);
    }
}

class CameraFrameLineSegments extends THREE.LineSegments {
    constructor(
        readonly geometry: THREE.BufferGeometry,
        readonly material: THREE.LineBasicMaterial,
        readonly frameOrigin: number[],
        readonly relativeFramePositions: number[][]) {
        super(geometry, material);
    }
}

abstract class CameraFrameBase extends THREE.Object3D {
    constructor(protected readonly _originalSize: number) {
        super();
    }

    public dispose(): void {
        for (const child of this.children) {
            const frameLine = <CameraFrameLine | CameraFrameLineSegments>child;
            frameLine.geometry.dispose();
            frameLine.material.dispose();
        }
    }

    public setColor(color: string): void {
        for (const child of this.children) {
            const frameLine = <CameraFrameLine | CameraFrameLineSegments>child;
            this._updateColorAttribute(frameLine, color);
        }
    }

    public resize(scale: number): void {
        for (const child of this.children) {
            const frameLine = <CameraFrameLine | CameraFrameLineSegments>child;
            this._updatePositionAttribute(frameLine, scale);
        }
    }

    protected _createBufferGeometry(
        positions: number[][]): THREE.BufferGeometry {
        const positionAttribute = new THREE.BufferAttribute(
            new Float32Array(3 * positions.length), 3)
        const colorAttribute = new THREE.BufferAttribute(
            new Float32Array(3 * positions.length), 3)
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", positionAttribute);
        geometry.setAttribute("color", colorAttribute);
        return geometry;
    }

    protected _createCameraFrame(
        origin: number[],
        relativePositions: number[][],
        scale: number,
        color: string):
        CameraFrameLine {
        const geometry = this._createBufferGeometry(relativePositions);
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
        });
        const frame = new CameraFrameLine(
            geometry, material, origin, relativePositions);
        this._updatePositionAttribute(frame, scale);
        this._updateColorAttribute(frame, color);

        return frame;
    }

    protected _updateColorAttribute(
        frame: CameraFrameLine | CameraFrameLineSegments,
        color: string): void {
        const [r, g, b] = new THREE.Color(color).toArray();
        const colorAttribute =
            <THREE.BufferAttribute>frame.geometry.attributes.color;
        const colors = <Float32Array>colorAttribute.array;

        const length = colors.length;
        let index = 0;
        for (let i = 0; i < length; i++) {
            colors[index++] = r;
            colors[index++] = g;
            colors[index++] = b;
        }

        colorAttribute.needsUpdate = true;
    }

    protected _updatePositionAttribute(
        frame: CameraFrameLine | CameraFrameLineSegments,
        scale: number): void {
        const positionAttribute =
            <THREE.BufferAttribute>frame.geometry.attributes.position;
        const positions = <Float32Array>positionAttribute.array;

        const originX = frame.frameOrigin[0];
        const originY = frame.frameOrigin[1];
        const originZ = frame.frameOrigin[2];

        const relativePositions = frame.relativeFramePositions;
        const length = relativePositions.length;

        let index = 0;
        for (let i = 0; i < length; i++) {
            const [deltaX, deltaY, deltaZ] = relativePositions[i];

            positions[index++] = originX + scale * deltaX;
            positions[index++] = originY + scale * deltaY;
            positions[index++] = originZ + scale * deltaZ;
        }

        positionAttribute.needsUpdate = true;

        frame.geometry.computeBoundingSphere();
    }

    protected _makeRelative(
        positions: number[][],
        origin: number[]): number[][] {
        for (const position of positions) {
            position[0] = position[0] - origin[0];
            position[1] = position[1] - origin[1];
            position[2] = position[2] - origin[2];
        }

        return positions;
    }

}

class PerspectiveCameraFrame extends CameraFrameBase {
    private readonly _horizontalFrameSamples: number;
    private readonly _verticalFrameSamples: number;

    constructor(
        originalSize: number,
        transform: Transform,
        scale: number,
        color: string) {
        super(originalSize);

        this._horizontalFrameSamples = 8;
        this._verticalFrameSamples = 6;

        const origin = transform.unprojectBasic([0, 0], 0, true);
        const frame = this._createFrame(transform, scale, origin, color);
        const diagonals = this._createDiagonals(transform, scale, origin, color);

        this.add(frame, diagonals);
    }

    private _calculateRelativeDiagonals(
        transform: Transform,
        origin: number[]): number[][] {
        const depth = this._originalSize;
        const [topLeft, topRight, bottomRight, bottomLeft] =
            this._makeRelative(
                [
                    transform.unprojectBasic([0, 0], depth, true),
                    transform.unprojectBasic([1, 0], depth, true),
                    transform.unprojectBasic([1, 1], depth, true),
                    transform.unprojectBasic([0, 1], depth, true),
                ],
                origin);

        const cameraCenter = [0, 0, 0];
        const vertices: number[][] = [
            cameraCenter, topLeft,
            cameraCenter, topRight,
            cameraCenter, bottomRight,
            cameraCenter, bottomLeft,
        ];

        return vertices;
    }

    private _calculateRelativeFrame(transform: Transform, origin: number[]):
        number[][] {
        const vertices2d: number[][] = [];
        const vertical = this._verticalFrameSamples;
        const horizontal = this._horizontalFrameSamples;
        const cameraSize = this._originalSize;

        vertices2d.push(...this._subsample([0, 1], [0, 0], vertical));
        vertices2d.push(...this._subsample([0, 0], [1, 0], horizontal));
        vertices2d.push(...this._subsample([1, 0], [1, 1], vertical));

        const vertices3d = vertices2d
            .map(
                (basic: number[]): number[] => {
                    return transform.unprojectBasic(basic, cameraSize, true);
                });

        return this._makeRelative(vertices3d, origin);
    }

    private _createDiagonals(
        transform: Transform,
        scale: number,
        origin: number[],
        color: string): CameraFrameLineSegments {
        const positions = this._calculateRelativeDiagonals(transform, origin);
        const geometry = this._createBufferGeometry(positions);
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
        });
        const diagonals = new CameraFrameLineSegments(geometry, material, origin, positions);
        this._updatePositionAttribute(diagonals, scale);
        this._updateColorAttribute(diagonals, color);
        return diagonals;
    }

    private _createFrame(
        transform: Transform,
        scale: number,
        origin: number[],
        color: string): CameraFrameLine {
        const positions = this._calculateRelativeFrame(transform, origin);
        return this._createCameraFrame(origin, positions, scale, color);
    }


    private _interpolate(a: number, b: number, alpha: number): number {
        return a + alpha * (b - a);
    }

    private _subsample(
        p1: number[],
        p2: number[],
        subsamples: number): number[][] {
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

class PanoCameraFrame extends CameraFrameBase {
    private readonly _latitudeVertices: number;
    private readonly _longitudeVertices: number;

    constructor(
        originalSize: number,
        transform: Transform,
        scale: number,
        color: string) {
        super(originalSize);

        this._latitudeVertices = 10;
        this._longitudeVertices = 6;

        const latV = this._latitudeVertices;
        const lonV = this._longitudeVertices;
        const origin = transform.unprojectBasic([0, 0], 0, true);
        const axis =
            this._createAxis(transform, scale, origin, color);
        const lat =
            this._createLatitude(0.5, latV, transform, scale, origin, color);
        const lon1 =
            this._createLongitude(0, lonV, transform, scale, origin, color);
        const lon2 =
            this._createLongitude(0.25, lonV, transform, scale, origin, color);
        const lon3 =
            this._createLongitude(0.5, lonV, transform, scale, origin, color);
        const lon4 =
            this._createLongitude(0.75, lonV, transform, scale, origin, color);

        this.add(axis, lat, lon1, lon2, lon3, lon4);
    }

    private _calculateRelativeAxis(transform: Transform, origin: number[]):
        number[][] {
        const depth = this._originalSize;
        const north: number[] = transform.unprojectBasic([0.5, 0], depth * 1.1);
        const south: number[] = transform.unprojectBasic([0.5, 1], depth * 0.8);

        return this._makeRelative([north, south], origin);
    }

    private _calculateRelativeLatitude(
        basicY: number,
        numVertices: number,
        transform: Transform,
        origin: number[]): number[][] {

        const depth = 0.8 * this._originalSize;
        const positions: number[][] = [];

        for (let i: number = 0; i <= numVertices; i++) {
            const position: number[] =
                transform.unprojectBasic(
                    [i / numVertices, basicY], depth);
            positions.push(position);
        }

        return this._makeRelative(positions, origin);
    }

    private _calculateRelativeLongitude(
        basicX: number,
        numVertices: number,
        transform: Transform,
        origin: number[]): number[][] {
        const scaledDepth = 0.8 * this._originalSize;
        const positions: number[][] = [];

        for (let i: number = 0; i <= numVertices; i++) {
            const position: number[] =
                transform.unprojectBasic(
                    [basicX, i / numVertices], scaledDepth);

            positions.push(position);
        }

        return this._makeRelative(positions, origin);
    }

    private _createAxis(
        transform: Transform,
        scale: number,
        origin: number[],
        color: string): CameraFrameLine {
        const positions = this._calculateRelativeAxis(transform, origin);
        return this._createCameraFrame(origin, positions, scale, color);
    }

    private _createLatitude(
        basicY: number,
        numVertices: number,
        transform: Transform,
        scale: number,
        origin: number[],
        color: string): CameraFrameLine {
        const positions = this._calculateRelativeLatitude(
            basicY, numVertices, transform, origin);
        return this._createCameraFrame(origin, positions, scale, color);
    }

    private _createLongitude(
        basicX: number,
        numVertices: number,
        transform: Transform,
        scale: number,
        origin: number[],
        color: string): CameraFrameLine {
        const positions = this._calculateRelativeLongitude(
            basicX, numVertices, transform, origin);
        return this._createCameraFrame(origin, positions, scale, color);
    }
}

class ClusterPoints extends THREE.Points {
    constructor(
        private readonly _originalSize: number,
        reconstruction: IClusterReconstruction,
        translation: number[],
        scale: number) {
        super();

        const [positions, colors] =
            this._getArrays(reconstruction, translation);

        const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material: THREE.PointsMaterial = new THREE.PointsMaterial({
            size: scale * this._originalSize,
            vertexColors: true,
        });

        this.geometry = geometry;
        this.material = material;
    }

    public dispose(): void {
        this.geometry.dispose();
        (<THREE.PointsMaterial>this.material).dispose();
    }

    public resize(scale: number): void {
        const material = <THREE.PointsMaterial>this.material;
        material.size = scale * this._originalSize;
        material.needsUpdate = true;
    }

    private _getArrays(
        reconstruction: IClusterReconstruction,
        translation: number[]): [Float32Array, Float32Array] {
        const points = Object
            .keys(reconstruction.points)
            .map(
                (key: string): IReconstructionPoint => {
                    return reconstruction.points[key];
                });

        const numPoints = points.length;
        const positions = new Float32Array(numPoints * 3);
        const colors = new Float32Array(numPoints * 3);
        const [translationX, translationY, translationZ] = translation;

        for (let i = 0; i < numPoints; i++) {
            const index = 3 * i;

            const [coordsX, coordsY, coordsZ] = points[i].coordinates;
            positions[index + 0] = coordsX + translationX;
            positions[index + 1] = coordsY + translationY;
            positions[index + 2] = coordsZ + translationZ;

            const color = points[i].color;
            colors[index + 0] = color[0] / 255.0;
            colors[index + 1] = color[1] / 255.0;
            colors[index + 2] = color[2] / 255.0;
        }

        return [positions, colors];
    }
}

class TileLine extends THREE.Line {
    constructor(bbox: number[][]) {
        super();
        this.geometry = this._createGeometry(bbox);
        this.material = new THREE.LineBasicMaterial();
    }

    public dispose(): void {
        this.geometry.dispose();
        (<THREE.Material>this.material).dispose();
    }

    private _createGeometry(bbox: number[][]): THREE.Geometry {
        const sw: number[] = bbox[0];
        const ne: number[] = bbox[1];

        const geometry: THREE.Geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3().fromArray(sw),
            new THREE.Vector3(sw[0], ne[1], (sw[2] + ne[2]) / 2),
            new THREE.Vector3().fromArray(ne),
            new THREE.Vector3(ne[0], sw[1], (sw[2] + ne[2]) / 2),
            new THREE.Vector3().fromArray(sw));

        return geometry;
    }
}

class PositionLine extends THREE.Line {
    public geometry: THREE.BufferGeometry;
    public material: THREE.LineBasicMaterial;

    private _adjustedAltitude: number;
    private _originalAltitude: number;

    constructor(
        transform: Transform,
        originalPosition: number[],
        mode: OriginalPositionMode) {
        super();

        this._adjustedAltitude = transform.unprojectSfM([0, 0], 0)[2];
        this._originalAltitude = originalPosition[2];
        const altitude = this._getAltitude(mode);
        this.geometry = this._createGeometry(
            transform,
            originalPosition,
            altitude);
        this.material =
            new THREE.LineBasicMaterial({ color: new THREE.Color(1, 0, 0) });
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    public setMode(mode: OriginalPositionMode): void {
        const positionAttribute =
            <THREE.BufferAttribute>this.geometry.attributes.position;
        const positions = <Float32Array>positionAttribute.array;

        positions[2] = this._getAltitude(mode);

        positionAttribute.needsUpdate = true;
        this.geometry.computeBoundingSphere();
    }

    private _createGeometry(
        transform: Transform,
        originalPosition: number[],
        altitude: number):
        THREE.BufferGeometry {
        const vertices = [
            [
                originalPosition[0],
                originalPosition[1],
                altitude,
            ],
            transform.unprojectBasic([0, 0], 0)];

        const positions = new Float32Array(3 * vertices.length);
        let index = 0;
        for (const vertex of vertices) {
            positions[index++] = vertex[0];
            positions[index++] = vertex[1];
            positions[index++] = vertex[2];
        }

        const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3));

        return geometry;
    }

    private _getAltitude(mode: OriginalPositionMode): number {
        return mode === OriginalPositionMode.Altitude ?
            this._originalAltitude :
            this._adjustedAltitude;
    }
}

export class SpatialDataScene {
    private _scene: THREE.Scene;
    private _raycaster: THREE.Raycaster;

    private _cameraColors: { [id: string]: string };
    private _needsRender: boolean;
    private _interactiveObjects: THREE.Object3D[];

    private _tileClusterReconstructions: {
        [cellId: string]: {
            keys: string[];
        };
    };

    private _clusterReconstructions: ClusterReconstructions;

    private _nodes: {
        [cellId: string]: {
            cameraFrames: { [key: string]: CameraFrameBase };
            cameraIds: {
                [key: string]: {
                    clusterKey: string;
                    connectedComponent: string;
                    sequenceKey: string;
                };
            };
            cameraKeys: { [id: string]: string };
            cameras: THREE.Object3D;
            clusters: { [id: string]: CameraFrameBase[] };
            connectedComponents: { [id: string]: CameraFrameBase[] };
            keys: string[];
            positions: THREE.Object3D;
            sequences: { [id: string]: CameraFrameBase[] };
            props: { [id: string]: Node };
        };
    };

    private _keyToCellId: { [key: string]: string };

    private _tiles: { [cellId: string]: THREE.Object3D };

    private _cameraVisualizationMode: CameraVisualizationMode;
    private _cameraSize: number;
    private _camerasVisible: boolean;
    private _pointSize: number;
    private _pointsVisible: boolean;
    private _positionMode: OriginalPositionMode;
    private _tilesVisible: boolean;

    private readonly _rayNearScale: number;
    private readonly _originalPointSize: number;
    private readonly _originalCameraSize: number;

    private readonly _lineThreshold: number;
    private readonly _largeLineThreshold: number;

    private _hoveredKey: string;
    private _selectedKey: string;

    private _interactiveLayer: number;
    private _filter: FilterFunction;

    constructor(configuration: ISpatialDataConfiguration, scene?: THREE.Scene, raycaster?: THREE.Raycaster) {
        this._rayNearScale = 1.1;
        this._originalPointSize = 2;
        this._originalCameraSize = 2;

        this._lineThreshold = 0.1;
        this._largeLineThreshold = 0.4;

        this._scene = !!scene ? scene : new THREE.Scene();

        this._interactiveLayer = 1;
        const near = this._getNear(configuration.cameraSize);
        const far = 3000;
        this._raycaster = !!raycaster ?
            raycaster :
            new THREE.Raycaster(
                undefined,
                undefined,
                near,
                far);
        this._raycaster.params.Line.threshold = this._lineThreshold;
        this._raycaster.layers.set(this._interactiveLayer);


        this._cameraColors = {};
        this._needsRender = false;
        this._interactiveObjects = [];
        this._nodes = {};
        this._tiles = {};
        this._tileClusterReconstructions = {};
        this._clusterReconstructions = {};
        this._keyToCellId = {};

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
        this._positionMode = configuration.originalPositionMode;
        this._tilesVisible = configuration.tilesVisible;

        this._hoveredKey = null;
        this._selectedKey = null;

        this._filter = () => true;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public addClusterReconstruction(
        reconstruction: IClusterReconstruction,
        translation: number[],
        cellId: string): void {

        if (this.hasClusterReconstruction(reconstruction.key, cellId)) {
            return;
        }

        const key: string = reconstruction.key;

        if (!(key in this._clusterReconstructions)) {
            this._clusterReconstructions[key] = {
                points: new THREE.Object3D(),
                tiles: [],
            };

            this._clusterReconstructions[key].points.visible =
                this._pointsVisible;
            this._clusterReconstructions[key].points.add(
                new ClusterPoints(
                    this._originalPointSize,
                    reconstruction,
                    translation,
                    this._pointSize));

            this._scene.add(
                this._clusterReconstructions[key].points);
        }

        if (this._clusterReconstructions[key].tiles.indexOf(cellId) === -1) {
            this._clusterReconstructions[key].tiles.push(cellId);
        }

        if (!(cellId in this._tileClusterReconstructions)) {
            this._tileClusterReconstructions[cellId] = {
                keys: [],
            };
        }

        if (this._tileClusterReconstructions[cellId].keys.indexOf(key) === -1) {
            this._tileClusterReconstructions[cellId].keys.push(key);
        }

        this._needsRender = true;
    }

    public addNode(
        node: Node,
        transform: Transform,
        originalPosition: number[],
        cellId: string): void {

        const key: string = node.key;
        const clusterKey: string = !!node.clusterKey ?
            node.clusterKey : "default_cluster_key";
        const sequenceKey: string = !!node.sequenceKey ?
            node.sequenceKey : "default_sequence_key";
        const connectedComponent: string = !!node.mergeCC ?
            node.mergeCC.toString() : "default_mergecc_key";

        if (this.hasNode(key, cellId)) {
            return;
        }

        if (!(cellId in this._nodes)) {
            this._nodes[cellId] = {
                cameraFrames: {},
                cameraKeys: {},
                cameras: new THREE.Object3D(),
                clusters: {},
                connectedComponents: {},
                keys: [],
                positions: new THREE.Object3D(),
                sequences: {},
                cameraIds: {},
                props: {},
            };

            this._nodes[cellId].cameras.visible = this._camerasVisible;
            this._nodes[cellId].positions.visible =
                this._positionMode !== OriginalPositionMode.Hidden;

            this._scene.add(
                this._nodes[cellId].cameras,
                this._nodes[cellId].positions);
        }

        const nodeCell = this._nodes[cellId];

        if (!(connectedComponent in nodeCell.connectedComponents)) {
            nodeCell.connectedComponents[connectedComponent] = [];
        }

        if (!(clusterKey in nodeCell.clusters)) {
            nodeCell.clusters[clusterKey] = [];
        }

        if (!(sequenceKey in nodeCell.sequences)) {
            nodeCell.sequences[sequenceKey] = [];
        }

        const scale = this._cameraSize;
        const maxSize = this._originalCameraSize;

        const id = this._getId(
            clusterKey,
            connectedComponent,
            sequenceKey,
            this._cameraVisualizationMode);

        const color = this._getColor(id, this._cameraVisualizationMode);

        const camera = !!transform.gpano ?
            new PanoCameraFrame(maxSize, transform, scale, color) :
            new PerspectiveCameraFrame(maxSize, transform, scale, color);
        this._applyFilter(camera, node, this._filter);

        nodeCell.cameras.add(camera);

        for (const child of camera.children) {
            nodeCell.cameraKeys[child.uuid] = key;
            this._interactiveObjects.push(child);
        }

        nodeCell.props[key] = node;
        nodeCell.connectedComponents[connectedComponent].push(camera);
        nodeCell.clusters[clusterKey].push(camera);
        nodeCell.sequences[sequenceKey].push(camera);

        nodeCell.positions.add(
            new PositionLine(transform, originalPosition, this._positionMode));

        nodeCell.keys.push(key);
        nodeCell.cameraFrames[key] = camera;
        nodeCell.cameraIds[key] =
            { clusterKey, connectedComponent, sequenceKey };

        this._keyToCellId[key] = cellId;

        if (key === this._selectedKey) {
            this._setSelectedKeyColor(key, this._cameraVisualizationMode);
        }

        this._needsRender = true;
    }

    public addTile(bbox: number[][], cellId: string): void {
        if (this.hasTile(cellId)) {
            return;
        }

        const tile = new TileLine(bbox);
        this._tiles[cellId] = new THREE.Object3D();
        this._tiles[cellId].visible = this._tilesVisible;
        this._tiles[cellId].add(tile);
        this._scene.add(this._tiles[cellId]);

        this._needsRender = true;
    }

    public hasClusterReconstruction(key: string, cellId: string): boolean {
        return key in this._clusterReconstructions &&
            this._clusterReconstructions[key].tiles.indexOf(cellId) !== -1;
    }

    public hasTile(cellId: string): boolean {
        return cellId in this._tiles;
    }

    public hasNode(key: string, cellId: string): boolean {
        return cellId in this._nodes && this._nodes[cellId].keys.indexOf(key) !== -1;
    }

    public intersectObjects(
        [viewportX, viewportY]: number[],
        camera: THREE.Camera): string {

        if (!this._camerasVisible) {
            return null;
        }

        this._raycaster.setFromCamera(new THREE.Vector2(viewportX, viewportY), camera);

        const intersects: THREE.Intersection[] =
            this._raycaster.intersectObjects(this._interactiveObjects);
        for (const intersect of intersects) {
            for (const cellId in this._nodes) {
                if (!this._nodes.hasOwnProperty(cellId)) {
                    continue;
                }

                if (intersect.object.uuid in this._nodes[cellId].cameraKeys) {
                    return this._nodes[cellId].cameraKeys[intersect.object.uuid];
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
                (<CameraFrameBase>camera).resize(cameraSize);
            }
        }

        this._raycaster.near = this._getNear(cameraSize);
        this._cameraSize = cameraSize;
        this._needsRender = true;
    }

    public setCameraVisibility(visible: boolean): void {
        if (visible === this._camerasVisible) {
            return;
        }

        for (const cellId in this._nodes) {
            if (!this._nodes.hasOwnProperty(cellId)) {
                continue;
            }

            this._nodes[cellId].cameras.visible = visible;
        }

        this._camerasVisible = visible;
        this._needsRender = true;
    }

    public setFilter(filter: FilterFunction): void {
        this._filter = filter;

        const nodes = this._nodes;
        for (const cellId in nodes) {
            if (!(nodes.hasOwnProperty(cellId))) {
                continue;
            }

            const cell = nodes[cellId];
            for (const key in cell.props) {
                if (!(cell.props.hasOwnProperty(key))) {
                    continue;
                }

                const node = cell.props[key];
                const camera = cell.cameraFrames[key];
                this._applyFilter(camera, node, filter);
            }
        }

        this._needsRender = true;
    }

    public setLargeIntersectionThreshold(large: boolean): void {
        this._raycaster.params.Line.threshold = large ?
            this._largeLineThreshold :
            this._lineThreshold;
    }

    public setHoveredKey(key?: string): void {
        key = key != null ? key : null;
        if (key != null && !(key in this._keyToCellId)) {
            throw new MapillaryError(`Node does not exist: ${key}`);
        }

        if (this._hoveredKey === key) {
            return;
        }

        this._needsRender = true;

        if (this._hoveredKey != null) {
            if (this._hoveredKey === this._selectedKey) {
                this._setSelectedKeyColor(
                    this._hoveredKey,
                    this._cameraVisualizationMode);
            } else {
                this._resetFrameColor(this._hoveredKey);
            }
        }

        this._setHoveredKeyColor(
            key,
            this._cameraVisualizationMode);

        this._hoveredKey = key;
    }

    public setPointSize(pointSize: number): void {
        if (Math.abs(pointSize - this._pointSize) < 1e-3) {
            return;
        }

        const scale = this._originalPointSize;
        const clusters = this._clusterReconstructions;
        for (const key in clusters) {
            if (!clusters.hasOwnProperty(key)) {
                continue;
            }

            for (const points of clusters[key].points.children) {
                (<ClusterPoints>points).resize(pointSize);
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

    public setPositionMode(mode: OriginalPositionMode): void {
        if (mode === this._positionMode) {
            return;
        }

        const nodes = this._nodes;
        for (const cellId in nodes) {
            if (!nodes.hasOwnProperty(cellId)) {
                continue;
            }

            const cell = nodes[cellId];
            cell.positions.visible =
                mode !== OriginalPositionMode.Hidden;

            for (const position of cell.positions.children) {
                (<PositionLine>position).setMode(mode);
            }
        }

        this._positionMode = mode;
        this._needsRender = true;
    }

    public setSelectedKey(key?: string): void {
        key = key != null ? key : null;
        if (this._selectedKey === key) {
            return;
        }

        this._needsRender = true;

        if (this._selectedKey != null) {
            this._resetFrameColor(this._selectedKey);
        }

        this._setSelectedKeyColor(
            key,
            this._cameraVisualizationMode);

        this._selectedKey = key;
    }

    public setTileVisibility(visible: boolean): void {
        if (visible === this._tilesVisible) {
            return;
        }

        for (const cellId in this._tiles) {
            if (!this._tiles.hasOwnProperty(cellId)) {
                continue;
            }

            this._tiles[cellId].visible = visible;
        }

        this._tilesVisible = visible;
        this._needsRender = true;
    }

    public setCameraVisualizationMode(mode: CameraVisualizationMode): void {
        if (mode === this._cameraVisualizationMode) {
            return;
        }

        const nodes = this._nodes;
        for (const cellId in nodes) {
            if (!this._nodes.hasOwnProperty(cellId)) {
                continue;
            }

            let cameras: { [id: number]: CameraFrameBase[] } = undefined;

            if (mode === CameraVisualizationMode.Cluster) {
                cameras = nodes[cellId].clusters;
            } else if (mode === CameraVisualizationMode.ConnectedComponent) {
                cameras = nodes[cellId].connectedComponents;
            } else if (mode === CameraVisualizationMode.Sequence) {
                cameras = nodes[cellId].sequences;
            } else {
                const color: string = this._getColor("", mode);
                for (const child of nodes[cellId].cameras.children) {
                    (<CameraFrameBase>child).setColor(color);
                }

                continue;
            }

            for (const id in cameras) {
                if (!cameras.hasOwnProperty(id)) {
                    continue;
                }

                const color: string = this._getColor(id, mode);

                for (const camera of cameras[id]) {
                    camera.setColor(color);
                }
            }
        }

        this._setHoveredKeyColor(this._hoveredKey, mode);
        this._setSelectedKeyColor(this._selectedKey, mode);

        this._cameraVisualizationMode = mode;
        this._needsRender = true;
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {
        renderer.render(this._scene, perspectiveCamera);

        this._needsRender = false;
    }

    public uncache(keepCellIds?: string[]): void {
        for (const cellId of Object.keys(this._tileClusterReconstructions)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            this._disposeReconstruction(cellId);
        }

        for (const cellId of Object.keys(this._nodes)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            this._disposeNodes(cellId);
        }

        for (const cellId of Object.keys(this._tiles)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            this._disposeTile(cellId);
        }

        this._needsRender = true;
    }

    private _applyFilter(
        camera: THREE.Object3D,
        node: Node,
        filter: FilterFunction): void {
        const interactiveLayer = this._interactiveLayer;

        camera.visible = filter(node);
        if (camera.visible) {
            for (const child of camera.children) {
                child.layers.enable(interactiveLayer);
            }
        } else {
            for (const child of camera.children) {
                child.layers.disable(interactiveLayer);
            }
        }
    }

    private _disposeCameras(cellId: string): void {
        const tileCameras = this._nodes[cellId].cameras;

        for (const camera of tileCameras.children.slice()) {
            (<CameraFrameBase>camera).dispose();
            for (const child of camera.children) {
                const index = this._interactiveObjects.indexOf(child);
                if (index !== -1) {
                    this._interactiveObjects.splice(index, 1);
                } else {
                    console.warn(`Object does not exist (${child.id}) for ${cellId}`);
                }
            }

            tileCameras.remove(camera);
        }

        const keyToCellId = this._keyToCellId;
        const keys = this._nodes[cellId].keys;
        for (const key of keys) {
            delete keyToCellId[key];
        }

        this._scene.remove(tileCameras);
    }

    private _disposePoints(cellId: string): void {
        for (const key of this._tileClusterReconstructions[cellId].keys) {
            if (!(key in this._clusterReconstructions)) {
                continue;
            }

            const index: number = this._clusterReconstructions[key].tiles.indexOf(cellId);
            if (index === -1) {
                continue;
            }

            this._clusterReconstructions[key].tiles.splice(index, 1);

            if (this._clusterReconstructions[key].tiles.length > 0) {
                continue;
            }

            for (const points of this._clusterReconstructions[key].points.children.slice()) {
                (<ClusterPoints>points).dispose();
            }

            this._scene.remove(this._clusterReconstructions[key].points);

            delete this._clusterReconstructions[key];
        }
    }

    private _disposePositions(cellId: string): void {
        const tilePositions: THREE.Object3D = this._nodes[cellId].positions;

        for (const position of tilePositions.children.slice()) {
            (<PositionLine>position).dispose();
            tilePositions.remove(position);
        }

        this._scene.remove(tilePositions);
    }

    private _disposeNodes(cellId: string): void {
        this._disposeCameras(cellId);
        this._disposePositions(cellId);

        delete this._nodes[cellId];
    }

    private _disposeReconstruction(cellId: string): void {
        this._disposePoints(cellId);

        delete this._tileClusterReconstructions[cellId];
    }

    private _disposeTile(cellId: string): void {
        const tile: THREE.Object3D = this._tiles[cellId];

        for (const line of tile.children.slice()) {
            (<TileLine>line).dispose();
            tile.remove(line);
        }

        this._scene.remove(tile);

        delete this._tiles[cellId];
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

    private _getNear(cameraSize: number): number {
        const near = this._rayNearScale *
            this._originalCameraSize *
            cameraSize;

        return Math.max(1, near);
    }

    private _randomColor(): string {
        return `hsl(${Math.floor(360 * Math.random())}, 100%, 50%)`;
    }

    private _resetFrameColor(key: string): void {
        if (key == null || !(key in this._keyToCellId)) {
            return;
        }

        const cellId = this._keyToCellId[key];
        const cameraIds = this._nodes[cellId].cameraIds[key];
        const id = this._getId(
            cameraIds.clusterKey,
            cameraIds.connectedComponent,
            cameraIds.sequenceKey,
            this._cameraVisualizationMode);

        const color = this._getColor(id, this._cameraVisualizationMode);
        this._nodes[cellId].cameraFrames[key].setColor(color);
    }

    private _setHoveredKeyColor(key: string, mode: CameraVisualizationMode)
        : void {
        if (key == null) {
            return;
        }

        const cellId = this._keyToCellId[key];
        const color = mode === CameraVisualizationMode.Default ?
            "#FF0000" : "#FFFFFF";
        this._nodes[cellId].cameraFrames[key].setColor(color);
    }

    private _setSelectedKeyColor(key: string, mode: CameraVisualizationMode)
        : void {
        if (key == null || !(key in this._keyToCellId)) {
            return;
        }

        const cellId = this._keyToCellId[key];
        const color = mode === CameraVisualizationMode.Default ?
            "#FF8000" : "#FFFFFF";
        this._nodes[cellId].cameraFrames[key].setColor(color);
    }
}

export default SpatialDataScene;
