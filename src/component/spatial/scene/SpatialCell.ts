import {
    LineBasicMaterial,
    Object3D,
    Scene,
} from "three";
import { CameraFrameBase, CameraFrameParameters } from "./CameraFrameBase";
import { PositionLine, PositionLineParameters } from "./PositionLine";
import { SpatialIntersection } from "./SpatialIntersection";
import { Image } from "../../../graph/Image";
import { Transform } from "../../../geo/Transform";
import { OriginalPositionMode } from "../enums/OriginalPositionMode";
import { FilterFunction } from "../../../graph/FilterCreator";
import { CameraVisualizationMode } from "../enums/CameraVisualizationMode";
import { isSpherical } from "../../../geo/Geo";
import { SphericalCameraFrame } from "./SphericalCameraFrame";
import { PerspectiveCameraFrame } from "./PerspectiveCameraFrame";
import { LngLatAlt } from "../../../api/interfaces/LngLatAlt";
import { resetEnu } from "../SpatialCommon";

type IDCamera = {
    camera: CameraFrameBase,
    clusterId: string,
};

type ColorIdCamerasMap = Map<string, IDCamera[]>;

type ImageIdMap = {
    ccId: string;
    clusterId: string;
    sequenceId: string;
};

type ImageProps = {
    image: Image;
    idMap: ImageIdMap;
};

type ImageVisualizationProps = {
    id: string;
    color: string | number;
    transform: Transform;
    originalPosition: number[];
    scale: number;
    maxSize: number;
    visible: boolean;
    positionMode: OriginalPositionMode;
};

const DEFAULT_ID = CameraVisualizationMode[CameraVisualizationMode.Homogeneous];

export class SpatialCell {
    public readonly cameras: Object3D;
    public readonly keys: string[];
    public clusterVisibles: { [key: string]: boolean; };

    private readonly _positions: Object3D;
    private readonly _positionLines: { [key: string]: PositionLine; };
    private readonly _cameraFrames: { [key: string]: CameraFrameBase; };
    private readonly _clusters: ColorIdCamerasMap;
    private readonly _connectedComponents: ColorIdCamerasMap;
    private readonly _defaults: ColorIdCamerasMap;
    private readonly _sequences: ColorIdCamerasMap;
    private readonly _props: {
        [id: string]: {
            image: Image,
            ids: ImageIdMap,
        };
    };

    private _frameMaterial: LineBasicMaterial;
    private _positionMaterial: LineBasicMaterial;

    private readonly _clusterImages: Map<string, string[]>;

    constructor(
        public readonly id: string,
        private _scene: Scene,
        private _intersection: SpatialIntersection) {

        this.cameras = new Object3D();
        this.keys = [];
        this._positionLines = {};
        this._positions = new Object3D();

        this._cameraFrames = {};

        this._clusters = new Map();
        this._connectedComponents = new Map();
        this._defaults = new Map();
        this._sequences = new Map();

        this._props = {};
        this.clusterVisibles = {};

        this._frameMaterial = new LineBasicMaterial({
            vertexColors: true,
        });
        this._positionMaterial = new LineBasicMaterial({
            color: 0xff0000,
        });

        this._clusterImages = new Map();

        this._scene.add(
            this.cameras,
            this._positions);
    }

    public addImage(props: ImageProps): void {
        const image = props.image;
        const id = image.id;
        if (this.hasImage(id)) {
            throw new Error(`Image exists ${id}`);
        }

        const cId = props.idMap.clusterId;
        if (!this._clusters.has(cId)) {
            this._clusters.set(cId, []);
        }

        const ccId = props.idMap.ccId;
        if (!(this._connectedComponents.has(ccId))) {
            this._connectedComponents.set(ccId, []);
        }

        if (!(this._defaults.has(DEFAULT_ID))) {
            this._defaults.set(DEFAULT_ID, []);
        }

        const sId = props.idMap.sequenceId;
        if (!this._sequences.has(sId)) {
            this._sequences.set(sId, []);
        }

        this._props[id] = {
            image: image,
            ids: { ccId, clusterId: cId, sequenceId: sId },
        };
        this.keys.push(id);

        if (!this._clusterImages.has(cId)) {
            this._clusterImages.set(cId, []);
        }
        this._clusterImages.get(cId).push(id);
    }

    public applyCameraColor(imageId: string, color: string | number): void {
        this._cameraFrames[imageId].setColor(color);
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
            const image = props.image;
            const visible = filter(image);
            const key = image.id;
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


    public disposeCluster(clusterId: string): void {
        if (!this._clusterImages.has(clusterId)) {
            return;
        }

        const {
            _cameraFrames,
            _intersection,
            _positionLines,
            _positions,
            _props,
            cameras,
            keys,
        } = this;

        const imageIds = this._clusterImages.get(clusterId);
        for (const imageId of imageIds) {
            this._disposeCamera(
                _cameraFrames[imageId],
                cameras,
                _intersection);
            this._disposePosition(
                _positionLines[imageId],
                _positions
            );

            delete _cameraFrames[imageId];
            delete _positionLines[imageId];

            const index = keys.indexOf(imageId);
            if (index !== -1) {
                keys.splice(index, 1);
            }

            delete _props[imageId];
        }

        this._clusterImages.delete(clusterId);
        this._clusters.delete(clusterId);
        delete this.clusterVisibles[clusterId];
    }

    public getCamerasByMode(mode: CameraVisualizationMode): ColorIdCamerasMap {
        switch (mode) {
            case CameraVisualizationMode.Cluster:
                return this._clusters;
            case CameraVisualizationMode.ConnectedComponent:
                return this._connectedComponents;
            case CameraVisualizationMode.Sequence:
                return this._sequences;
            default:
                return this._defaults;
        }
    }

    public getColorId(imageId: string, mode: CameraVisualizationMode): string {
        const props = this._props[imageId];
        const cvm = CameraVisualizationMode;
        switch (mode) {
            case cvm.Cluster:
                return props.ids.clusterId;
            case cvm.ConnectedComponent:
                return props.ids.ccId;
            case cvm.Sequence:
                return props.ids.sequenceId;
            default:
                return DEFAULT_ID;
        }
    }

    public hasImage(key: string): boolean {
        return this.keys.indexOf(key) !== -1;
    }

    public getCluster(imageId: string): string {
        if (!this.hasImage(imageId)) {
            throw new Error(`Image does not exist (${imageId})`);
        }

        return this._props[imageId].ids.clusterId;
    }

    public resetReference(
        reference: LngLatAlt,
        prevReference: LngLatAlt)
        : void {
        const frames = this._cameraFrames;
        for (const frameId in frames) {
            if (!frames.hasOwnProperty(frameId)) {
                continue;
            }
            const frame = frames[frameId];
            frame.position.fromArray(resetEnu(
                reference,
                frame.position.toArray(),
                prevReference));
            frame.update();
        }

        const lines = this._positionLines;
        for (const lineId in lines) {
            if (!lines.hasOwnProperty(lineId)) {
                continue;
            }
            const line = lines[lineId];
            line.position.fromArray(resetEnu(
                reference,
                line.position.toArray(),
                prevReference));
            line.update();
        }
    }

    public visualize(props: ImageVisualizationProps): void {
        const id = props.id;
        const visible = props.visible;
        const transform = props.transform;
        const cameraParameters: CameraFrameParameters = {
            color: props.color,
            material: this._frameMaterial,
            scale: props.scale,
            size: props.maxSize,
            transform,
        };
        const camera = isSpherical(transform.cameraType) ?
            new SphericalCameraFrame(cameraParameters) :
            new PerspectiveCameraFrame(cameraParameters);

        const interactiveLayer = this._intersection.interactiveLayer;
        this._setCameraVisibility(camera, visible, interactiveLayer);
        this.cameras.add(camera);
        this._cameraFrames[id] = camera;
        const intersection = this._intersection;
        intersection.add(camera, id);

        const ids = this._props[id].ids;
        this.clusterVisibles[ids.clusterId] ||= visible;
        const idCamera = { camera, clusterId: ids.clusterId };
        this._clusters.get(ids.clusterId).push(idCamera);
        this._connectedComponents.get(ids.ccId).push(idCamera);
        this._defaults.get(DEFAULT_ID).push(idCamera);
        this._sequences.get(ids.sequenceId).push(idCamera);

        const positionParameters: PositionLineParameters = {
            material: this._positionMaterial,
            mode: props.positionMode,
            originalOrigin: props.originalPosition,
            transform,
        };
        const position = new PositionLine(positionParameters);
        position.visible = visible;
        this._positions.add(position);
        this._positionLines[id] = position;
    }

    private _disposeCamera(
        camera: CameraFrameBase,
        cameras: Object3D,
        intersection: SpatialIntersection): void {
        camera.dispose();
        intersection.remove(camera);
        cameras.remove(camera);
    }

    private _disposeCameras(): void {
        const intersection = this._intersection;
        const cameras = this.cameras;
        for (const camera of cameras.children.slice()) {
            this._disposeCamera(<CameraFrameBase>camera, cameras, intersection);
        }
        this._scene.remove(this.cameras);
    }

    private _disposePosition(
        position: PositionLine,
        positions: Object3D): void {
        position.dispose();
        positions.remove(position);
    }

    private _disposePositions(): void {
        const positions = this._positions;
        for (const position of positions.children.slice()) {
            this._disposePosition(<PositionLine>position, positions);
        }
        this._scene.remove(this._positions);
    }

    private _setCameraVisibility(
        camera: Object3D,
        visible: boolean,
        layer: number): void {

        camera.visible = visible;
        if (visible) {
            camera.layers.enable(layer);
        } else {
            camera.layers.disable(layer);
        }
    }
};
