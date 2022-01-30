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

type ColorIdCamerasMap = Map<string, CameraFrameBase[]>;

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
    color: string;
    transform: Transform;
    originalPosition: number[];
    scale: number;
    maxSize: number;
    visible: boolean;
    positionMode: OriginalPositionMode;
};

export class SpatialCell {
    public readonly cameras: Object3D;
    public readonly keys: string[];
    public clusterVisibles: { [key: string]: boolean; };

    private readonly _positions: Object3D;
    private readonly _positionLines: { [key: string]: PositionLine; };
    private readonly _cameraFrames: { [key: string]: CameraFrameBase; };
    private readonly _clusters: ColorIdCamerasMap;
    private readonly _connectedComponents: ColorIdCamerasMap;
    private readonly _sequences: ColorIdCamerasMap;
    private readonly _props: {
        [id: string]: {
            image: Image,
            ids: ImageIdMap,
        };
    };

    private _frameMaterial: LineBasicMaterial;
    private _positionMaterial: LineBasicMaterial;

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
        this._sequences = new Map();
        this._props = {};
        this.clusterVisibles = {};

        this._frameMaterial = new LineBasicMaterial({
            fog: false,
            vertexColors: true,
        });
        this._positionMaterial = new LineBasicMaterial({
            fog: false,
            color: 0xff0000,
        });

        this._scene.add(
            this.cameras,
            this._positions);
    }

    public addImage(props: ImageProps): void {
        const image = props.image;
        const id = image.id;
        if (this.hasImage(id)) { throw new Error(`Image exists ${id}`); }
        const ccId = props.idMap.ccId;
        if (!(this._connectedComponents.has(ccId))) {
            this._connectedComponents.set(ccId, []);
        }
        const cId = props.idMap.clusterId;
        if (!this._clusters.has(cId)) { this._clusters.set(cId, []); }
        const sId = props.idMap.sequenceId;
        if (!this._sequences.has(sId)) { this._sequences.set(sId, []); }
        this._props[id] = {
            image: image,
            ids: { ccId, clusterId: cId, sequenceId: sId },
        };
        this.keys.push(id);
    }

    public applyCameraColor(imageId: string, color: string): void {
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
        const defaultId = cvm[cvm.Homogeneous];
        const cameras = <ColorIdCamerasMap>new Map();
        cameras.set(defaultId, <CameraFrameBase[]>this.cameras.children);
        return cameras;
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
                return cvm[cvm.Homogeneous];
        }
    }

    public hasImage(key: string): boolean {
        return this.keys.indexOf(key) !== -1;
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
        this._connectedComponents.get(ids.ccId).push(camera);
        this._clusters.get(ids.clusterId).push(camera);
        this._sequences.get(ids.sequenceId).push(camera);

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

    private _disposeCameras(): void {
        const intersection = this._intersection;
        const cameras = this.cameras;
        for (const camera of cameras.children.slice()) {
            (<CameraFrameBase>camera).dispose();
            intersection.remove(camera);
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
