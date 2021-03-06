import * as THREE from "three";

import {
    IClusterReconstruction,
    IReconstructionPoint,
} from "../../api/interfaces/IClusterReconstruction";
import { MapillaryError } from "../../error/MapillaryError";
import { Transform } from "../../geo/Transform";
import { FilterFunction } from "../../graph/FilterCreator";
import { Node } from "../../graph/Node";
import { ISpatialDataConfiguration } from "../interfaces/ISpatialDataConfiguration";
import { CameraVisualizationMode } from "./CameraVisualizationMode";
import { OriginalPositionMode } from "./OriginalPositionMode";

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
            fog: false,
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

    protected _updateMatrixWorld(object: THREE.Object3D): void {
        object.matrixAutoUpdate = false;
        object.updateMatrixWorld(true);
        object.updateWorldMatrix(false, true);
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

        this._updateMatrixWorld(frame);
        this._updateMatrixWorld(diagonals);

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
            fog: false,
        });
        const diagonals = new CameraFrameLineSegments(
            geometry,
            material,
            origin,
            positions);
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

        this._updateMatrixWorld(axis);
        this._updateMatrixWorld(lat);
        this._updateMatrixWorld(lon1);
        this._updateMatrixWorld(lon2);
        this._updateMatrixWorld(lon3);
        this._updateMatrixWorld(lon4);

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

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
            "position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute(
            "color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
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

    private _createGeometry(bbox: number[][]): THREE.BufferGeometry {
        const sw: number[] = bbox[0];
        const ne: number[] = bbox[1];

        const vertices = [
            sw.slice(),
            [sw[0], ne[1], (sw[2] + ne[2]) / 2],
            ne.slice(),
            [ne[0], sw[1], (sw[2] + ne[2]) / 2],
            sw.slice(),
        ];

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

class Intersection {
    private readonly _interactiveLayer: number;
    private readonly _objects: THREE.Object3D[];
    private readonly _objectNodeMap: Map<string, string>;
    private readonly _raycaster: THREE.Raycaster;

    private readonly _lineThreshold: number;
    private readonly _largeLineThreshold: number;

    constructor(raycaster?: THREE.Raycaster) {
        this._objects = [];
        this._objectNodeMap = new Map();
        this._raycaster = !!raycaster ? raycaster : new THREE.Raycaster();

        this._interactiveLayer = 1;
        this._raycaster = !!raycaster ?
            raycaster :
            new THREE.Raycaster(
                undefined,
                undefined,
                1,
                3000);

        this._lineThreshold = 0.1;
        this._largeLineThreshold = 0.4;

        this._raycaster.params.Line.threshold = this._lineThreshold;
        this._raycaster.layers.set(this._interactiveLayer);
    }

    get interactiveLayer(): number { return this._interactiveLayer; }
    get raycaster(): THREE.Raycaster { return this._raycaster; }

    public add(
        object: THREE.Object3D,
        nodeId: string): void {
        const uuid = object.uuid
        this._objectNodeMap.set(uuid, nodeId);
        this._objects.push(object);
    }

    public intersectObjects(
        viewport: number[],
        camera: THREE.Camera): string {
        this._raycaster.setFromCamera(
            new THREE.Vector2().fromArray(viewport),
            camera);

        const onMap = this._objectNodeMap;
        const intersects =
            this._raycaster.intersectObjects(this._objects);

        for (const intersect of intersects) {
            const uuid = intersect.object.uuid;
            if (!onMap.has(uuid)) { continue; }
            return onMap.get(uuid);
        }
        return null;
    }

    public remove(object: THREE.Object3D): void {
        const objects = this._objects;
        const index = objects.indexOf(object);
        if (index !== -1) {
            const deleted = objects.splice(index, 1);
            for (const d of deleted) {
                this._objectNodeMap.delete(d.uuid);
            }
        } else {
            console.warn(`Object does not exist`);
        }
    }

    public resetIntersectionThreshold(useLarge: boolean): void {
        this._raycaster.params.Line.threshold = useLarge ?
            this._largeLineThreshold :
            this._lineThreshold;
    }
}

type NodeProps = {
    node: Node;
    idMap: NodeIdMap;
};

type NodeVisualizationProps = {
    id: string;
    color: string;
    transform: Transform;
    originalPosition: number[];
    scale: number;
    maxSize: number;
    visible: boolean;
    positionMode: OriginalPositionMode;
};

type ColorIdCamerasMap = Map<string, CameraFrameBase[]>;

type NodeIdMap = {
    ccId: string;
    clusterId: string;
    sequenceId: string;
}

class NodeCell {
    public readonly cameras: THREE.Object3D;
    public readonly keys: string[];
    public clusterVisibles: { [key: string]: boolean };

    private readonly _positions: THREE.Object3D;
    private readonly _positionLines: { [key: string]: PositionLine };
    private readonly _cameraFrames: { [key: string]: CameraFrameBase };
    private readonly _clusters: ColorIdCamerasMap;
    private readonly _connectedComponents: ColorIdCamerasMap;
    private readonly _sequences: ColorIdCamerasMap;
    private readonly _props: {
        [id: string]: {
            node: Node,
            ids: NodeIdMap,
        }
    };

    constructor(
        public readonly id: string,
        private _scene: THREE.Scene,
        private _intersection: Intersection) {

        this.cameras = new THREE.Object3D();
        this.keys = [];
        this._positionLines = {};
        this._positions = new THREE.Object3D();

        this._cameraFrames = {};
        this._clusters = new Map();
        this._connectedComponents = new Map();
        this._sequences = new Map();
        this._props = {};
        this.clusterVisibles = {};

        this._scene.add(
            this.cameras,
            this._positions);
    }

    public addNode(props: NodeProps): void {
        const node = props.node;
        const id = node.key;
        if (this.hasNode(id)) { throw new Error(`Node exists ${id}`); }
        const ccId = props.idMap.ccId;
        if (!(this._connectedComponents.has(ccId))) {
            this._connectedComponents.set(ccId, []);
        }
        const cId = props.idMap.clusterId;
        if (!this._clusters.has(cId)) { this._clusters.set(cId, []); }
        const sId = props.idMap.sequenceId;
        if (!this._sequences.has(sId)) { this._sequences.set(sId, []); }
        this._props[id] = {
            node,
            ids: { ccId, clusterId: cId, sequenceId: sId },
        };
        this.keys.push(id);
    }

    public applyCameraColor(nodeId: string, color: string): void {
        this._cameraFrames[nodeId].setColor(color);
    }

    public applyCameraSize(size: number): void {
        for (const camera of this.cameras.children) {
            (<CameraFrameBase>camera).resize(size);
        }
    }

    public applyFilter(filter: FilterFunction): void {
        const clusterVisibles = this.clusterVisibles;
        for (const clusterId in clusterVisibles) {
            if (!clusterVisibles.hasOwnProperty(clusterId)) { continue; }
            clusterVisibles[clusterId] = false;
        }

        const cameraFrames = this._cameraFrames;
        const positionLines = this._positionLines;
        const interactiveLayer = this._intersection.interactiveLayer;
        for (const props of Object.values(this._props)) {
            const node = props.node;
            const visible = filter(node);
            const key = node.key;
            positionLines[key].visible = visible;
            const camera = cameraFrames[key];
            this._setCameraVisibility(camera, visible, interactiveLayer);
            clusterVisibles[props.ids.clusterId] ||= visible;
        }
    }

    public applyPositionMode(mode: OriginalPositionMode): void {
        this._positions.visible =
            mode !== OriginalPositionMode.Hidden;

        for (const position of this._positions.children) {
            (<PositionLine>position).setMode(mode);
        }
    }

    public dispose(): void {
        this._disposeCameras();
        this._disposePositions();
        this._scene = null;
        this._intersection = null;
    }

    public getCamerasByMode(
        mode: CameraVisualizationMode): ColorIdCamerasMap {
        if (mode === CameraVisualizationMode.Cluster) {
            return this._clusters;
        } else if (mode === CameraVisualizationMode.ConnectedComponent) {
            return this._connectedComponents;
        } else if (mode === CameraVisualizationMode.Sequence) {
            return this._sequences;
        }
        const cvm = CameraVisualizationMode;
        const defaultId = cvm[cvm.Default]
        const cameras = <ColorIdCamerasMap>new Map();
        cameras.set(defaultId, <CameraFrameBase[]>this.cameras.children);
        return cameras;
    }

    public getColorId(nodeId: string, mode: CameraVisualizationMode): string {
        const props = this._props[nodeId];
        const cvm = CameraVisualizationMode;
        switch (mode) {
            case cvm.Cluster:
                return props.ids.clusterId;
            case cvm.ConnectedComponent:
                return props.ids.ccId;
            case cvm.Sequence:
                return props.ids.sequenceId;
            default:
                return cvm[cvm.Default];
        }
    }

    public hasNode(key: string): boolean {
        return this.keys.indexOf(key) !== -1;
    }

    public visualize(props: NodeVisualizationProps): void {
        const id = props.id;
        const scale = props.scale;
        const maxSize = props.maxSize;
        const color = props.color;
        const visible = props.visible;
        const transform = props.transform;
        const camera = !!transform.gpano ?
            new PanoCameraFrame(maxSize, transform, scale, color) :
            new PerspectiveCameraFrame(maxSize, transform, scale, color);
        const interactiveLayer = this._intersection.interactiveLayer;
        this._setCameraVisibility(camera, visible, interactiveLayer);
        this.cameras.add(camera);
        this._cameraFrames[id] = camera;
        const intersection = this._intersection;
        for (const child of camera.children) { intersection.add(child, id); }

        const ids = this._props[id].ids;
        this.clusterVisibles[ids.clusterId] ||= visible;
        this._connectedComponents.get(ids.ccId).push(camera);
        this._clusters.get(ids.clusterId).push(camera);
        this._sequences.get(ids.sequenceId).push(camera);

        const positionLine = new PositionLine(
            transform,
            props.originalPosition,
            props.positionMode);
        positionLine.visible = visible;
        this._positions.add(positionLine);
        this._positionLines[id] = positionLine;
    }

    private _disposeCameras(): void {
        const intersection = this._intersection;
        const cameras = this.cameras;
        for (const camera of cameras.children.slice()) {
            (<CameraFrameBase>camera).dispose();
            for (const child of camera.children) {
                intersection.remove(child);
            }
            cameras.remove(camera);
        }
        this._scene.remove(this.cameras);
    }

    private _disposePositions(): void {
        const positions = this._positions;
        for (const position of positions.children.slice()) {
            (<PositionLine>position).dispose();
            positions.remove(position);
        }
        this._scene.remove(this._positions);
    }

    private _setCameraVisibility(
        camera: THREE.Object3D,
        visible: boolean,
        layer: number): void {

        camera.visible = visible;
        if (visible) {
            for (const child of camera.children) {
                child.layers.enable(layer);
            }
        } else {
            for (const child of camera.children) {
                child.layers.disable(layer);
            }
        }
    }
};

class SpatialAssets {
    private readonly _colors: Map<string, string>;

    constructor() {
        this._colors = new Map();
        const cvm = CameraVisualizationMode;
        this._colors.set(cvm[cvm.Default], "#FFFFFF");
    }

    public getColor(id: string): string {
        const colors = this._colors;
        if (!colors.has(id)) { colors.set(id, this._randomColor()); }
        return colors.get(id);
    }

    private _randomColor(): string {
        return `hsl(${Math.floor(360 * Math.random())}, 100%, 50%)`;
    }
}

export class SpatialDataScene {
    private _scene: THREE.Scene;
    private _intersection: Intersection;
    private _assets: SpatialAssets;

    private _needsRender: boolean;

    private _tileClusters: {
        [cellId: string]: { keys: string[]; };
    };
    private _clusters: ClusterReconstructions;
    private _nodes: { [cellId: string]: NodeCell };
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

    private _hoveredNode: string;
    private _selectedNode: string;

    private _filter: FilterFunction;

    private _nodeCellMap: Map<string, string>;

    private _colors: { hover: string, select: string };

    constructor(
        configuration: ISpatialDataConfiguration,
        scene?: THREE.Scene) {
        this._rayNearScale = 1.1;
        this._originalPointSize = 2;
        this._originalCameraSize = 2;

        this._nodeCellMap = new Map();

        this._scene = !!scene ? scene : new THREE.Scene();
        this._intersection = new Intersection();
        this._assets = new SpatialAssets();

        this._needsRender = false;
        this._nodes = {};
        this._tiles = {};
        this._tileClusters = {};
        this._clusters = {};

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

        this._hoveredNode = null;
        this._selectedNode = null;
        this._colors = { hover: "#FF0000", select: "#FF8000" };

        this._filter = () => true;
    }

    public get needsRender(): boolean { return this._needsRender; }
    public get intersection(): Intersection { return this._intersection; }

    public addClusterReconstruction(
        reconstruction: IClusterReconstruction,
        translation: number[],
        cellId: string): void {

        if (this.hasClusterReconstruction(reconstruction.key, cellId)) {
            return;
        }

        const clusterId = reconstruction.key;

        if (!(clusterId in this._clusters)) {
            this._clusters[clusterId] = {
                points: new THREE.Object3D(),
                tiles: [],
            };

            const visible = this._getClusterVisible(clusterId);
            this._clusters[clusterId].points.visible = visible;
            this._clusters[clusterId].points.add(
                new ClusterPoints(
                    this._originalPointSize,
                    reconstruction,
                    translation,
                    this._pointSize));

            this._scene.add(
                this._clusters[clusterId].points);
        }

        if (this._clusters[clusterId].tiles.indexOf(cellId) === -1) {
            this._clusters[clusterId].tiles.push(cellId);
        }
        if (!(cellId in this._tileClusters)) {
            this._tileClusters[cellId] = { keys: [] };
        }
        if (this._tileClusters[cellId].keys.indexOf(clusterId) === -1) {
            this._tileClusters[cellId].keys.push(clusterId);
        }

        this._needsRender = true;
    }

    public addNode(
        node: Node,
        transform: Transform,
        originalPosition: number[],
        cellId: string): void {

        const key = node.key;
        const idMap = {
            clusterId: !!node.clusterKey ?
                node.clusterKey : "default_cluster_key",
            sequenceId: !!node.sequenceKey ?
                node.sequenceKey : "default_sequence_key",
            ccId: !!node.mergeCC ?
                node.mergeCC.toString() : "default_mergecc_key",
        }

        if (!(cellId in this._nodes)) {
            const created = new NodeCell(
                cellId,
                this._scene,
                this._intersection);
            created.cameras.visible = this._camerasVisible;
            created.applyPositionMode(this._positionMode);
            this._nodes[cellId] = created;
        }

        const cell = this._nodes[cellId];
        if (cell.hasNode(key)) { return; }
        cell.addNode({ idMap, node });

        const colorId = cell.getColorId(key, this._cameraVisualizationMode);
        const color = this._assets.getColor(colorId);
        const visible = this._filter(node);
        cell.visualize({
            id: node.key,
            color,
            positionMode: this._positionMode,
            scale: this._cameraSize,
            transform,
            visible,
            maxSize: this._originalCameraSize,
            originalPosition
        });

        this._nodeCellMap.set(key, cellId);
        if (key === this._selectedNode) {
            this._highlight(
                key,
                this._colors.select,
                this._cameraVisualizationMode);
        }
        if (idMap.clusterId in this._clusters) {
            const clusterVisible = this._getClusterVisible(idMap.clusterId);
            this._clusters[idMap.clusterId].points.visible = clusterVisible;
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
        return key in this._clusters &&
            this._clusters[key].tiles.indexOf(cellId) !== -1;
    }

    public hasTile(cellId: string): boolean {
        return cellId in this._tiles;
    }

    public hasNode(key: string, cellId: string): boolean {
        return cellId in this._nodes &&
            this._nodes[cellId].hasNode(key);
    }

    public setCameraSize(cameraSize: number): void {
        if (Math.abs(cameraSize - this._cameraSize) < 1e-3) { return; }

        const nodeCells = this._nodes;
        for (const cellId of Object.keys(nodeCells)) {
            nodeCells[cellId].applyCameraSize(cameraSize);
        }

        this._intersection.raycaster.near = this._getNear(cameraSize);
        this._cameraSize = cameraSize;
        this._needsRender = true;
    }

    public setCameraVisibility(visible: boolean): void {
        if (visible === this._camerasVisible) { return; }

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
        const clusterVisibles: { [key: string]: boolean } = {};
        for (const nodeCell of Object.values(this._nodes)) {
            nodeCell.applyFilter(filter);
            const nodeCV = nodeCell.clusterVisibles
            for (const clusterId in nodeCV) {
                if (!nodeCV.hasOwnProperty(clusterId)) {
                    continue;
                }
                if (!(clusterId in clusterVisibles)) {
                    clusterVisibles[clusterId] = false;
                }
                clusterVisibles[clusterId] ||= nodeCV[clusterId];
            }
        }

        const pointsVisible = this._pointsVisible;
        for (const clusterId in clusterVisibles) {
            if (!clusterVisibles.hasOwnProperty(clusterId)) { continue; }
            clusterVisibles[clusterId] &&= pointsVisible
            const visible = clusterVisibles[clusterId];
            this._clusters[clusterId].points.visible = visible;
        }

        this._needsRender = true;
    }

    public setHoveredNode(key: string | null): void {
        if (key != null && !this._nodeCellMap.has(key)) {
            throw new MapillaryError(`Node does not exist: ${key}`);
        }

        if (this._hoveredNode === key) { return; }
        this._needsRender = true;

        if (this._hoveredNode != null) {
            if (this._hoveredNode === this._selectedNode) {
                this._highlight(
                    this._hoveredNode,
                    this._colors.select,
                    this._cameraVisualizationMode);
            } else {
                this._resetCameraColor(this._hoveredNode);
            }
        }

        this._highlight(
            key,
            this._colors.hover,
            this._cameraVisualizationMode);

        this._hoveredNode = key;
    }

    public setNavigationState(isEarth: boolean): void {
        this._intersection.resetIntersectionThreshold(isEarth);
    }

    public setPointSize(pointSize: number): void {
        if (Math.abs(pointSize - this._pointSize) < 1e-3) {
            return;
        }

        const clusters = this._clusters;
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

        for (const key in this._clusters) {
            if (!this._clusters.hasOwnProperty(key)) {
                continue;
            }

            this._clusters[key].points.visible = visible;
        }

        this._pointsVisible = visible;
        this._needsRender = true;

    }

    public setPositionMode(mode: OriginalPositionMode): void {
        if (mode === this._positionMode) { return; }
        for (const cell of Object.values(this._nodes)) {
            cell.applyPositionMode(mode);
        }
        this._positionMode = mode;
        this._needsRender = true;
    }

    public setSelectedNode(key: string | null): void {
        if (this._selectedNode === key) { return; }
        this._needsRender = true;

        if (this._selectedNode != null) {
            this._resetCameraColor(this._selectedNode);
        }

        this._highlight(
            key,
            this._colors.select,
            this._cameraVisualizationMode);

        this._selectedNode = key;
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
        if (mode === this._cameraVisualizationMode) { return; }

        const assets = this._assets;
        for (const cell of Object.values(this._nodes)) {
            const cameraMap = cell.getCamerasByMode(mode);
            cameraMap.forEach(
                (cameras, colorId) => {
                    const color = assets.getColor(colorId);
                    for (const camera of cameras) {
                        camera.setColor(color);
                    }
                });
        }

        this._highlight(this._hoveredNode, this._colors.hover, mode);
        this._highlight(this._selectedNode, this._colors.select, mode);

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
        for (const cellId of Object.keys(this._tileClusters)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            this._disposeReconstruction(cellId);
        }

        for (const cellId of Object.keys(this._nodes)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }
            const nceMap = this._nodeCellMap;
            const keys = this._nodes[cellId].keys;
            for (const key of keys) {
                nceMap.delete(key);
            }

            this._nodes[cellId].dispose();
            delete this._nodes[cellId];
        }

        for (const cellId of Object.keys(this._tiles)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            this._disposeTile(cellId);
        }

        this._needsRender = true;
    }

    private _getClusterVisible(clusterId: string): boolean {
        if (!this._pointsVisible) { return false; }
        let visible = false;
        for (const nodeCell of Object.values(this._nodes)) {
            const nodeCV = nodeCell.clusterVisibles;
            if (!(clusterId in nodeCV)) { continue; }
            visible ||= nodeCV[clusterId];
        }
        return visible;
    }

    private _disposePoints(cellId: string): void {
        for (const key of this._tileClusters[cellId].keys) {
            if (!(key in this._clusters)) {
                continue;
            }

            const index: number = this._clusters[key].tiles.indexOf(cellId);
            if (index === -1) {
                continue;
            }

            this._clusters[key].tiles.splice(index, 1);

            if (this._clusters[key].tiles.length > 0) {
                continue;
            }

            for (const points of this._clusters[key].points.children.slice()) {
                (<ClusterPoints>points).dispose();
            }

            this._scene.remove(this._clusters[key].points);

            delete this._clusters[key];
        }
    }

    private _disposeReconstruction(cellId: string): void {
        this._disposePoints(cellId);

        delete this._tileClusters[cellId];
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

    private _getNear(cameraSize: number): number {
        const near = this._rayNearScale *
            this._originalCameraSize *
            cameraSize;

        return Math.max(1, near);
    }

    private _resetCameraColor(key: string): void {
        const nceMap = this._nodeCellMap;
        if (key == null || !nceMap.has(key)) { return; }

        const cellId = nceMap.get(key);
        const cell = this._nodes[cellId];
        const colorId = cell.getColorId(key, this._cameraVisualizationMode);
        const color = this._assets.getColor(colorId);
        cell.applyCameraColor(key, color);
    }

    private _highlight(
        key: string,
        color: string,
        mode: CameraVisualizationMode): void {
        const nceMap = this._nodeCellMap;
        if (key == null || !nceMap.has(key)) { return; }
        const cellId = nceMap.get(key);
        color = mode === CameraVisualizationMode.Default ?
            color : "#FFFFFF";
        this._nodes[cellId].applyCameraColor(key, color);
    }
}
