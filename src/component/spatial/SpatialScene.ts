import {
    Object3D,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from "three";
import { ClusterContract }
    from "../../api/contracts/ClusterContract";
import { MapillaryError } from "../../error/MapillaryError";
import { Transform } from "../../geo/Transform";
import { FilterFunction } from "../../graph/FilterCreator";
import { Image } from "../../graph/Image";
import { SpatialConfiguration }
    from "../interfaces/SpatialConfiguration";
import { CameraVisualizationMode } from "./enums/CameraVisualizationMode";
import { OriginalPositionMode } from "./enums/OriginalPositionMode";
import { ClusterPoints } from "./scene/ClusterPoints";
import { TileLine } from "./scene/TileLine";
import { SpatialIntersection } from "./scene/SpatialIntersection";
import { SpatialCell } from "./scene/SpatialCell";
import { SpatialAssets } from "./scene/SpatialAssets";

const NO_CLUSTER_ID = "NO_CLUSTER_ID";
const NO_MERGE_ID = "NO_MERGE_ID";
const NO_SEQUENCE_ID = "NO_SEQUENCE_ID";

type Clusters = {
    [id: string]: {
        tiles: string[];
        points: Object3D;
    };
}

export function isModeVisible(mode: CameraVisualizationMode): boolean {
    return mode !== CameraVisualizationMode.Hidden;
}

export class SpatialScene {
    private _scene: Scene;
    private _intersection: SpatialIntersection;
    private _assets: SpatialAssets;

    private _needsRender: boolean;

    private _tileClusters: {
        [cellId: string]: { keys: string[]; };
    };
    private _clusters: Clusters;
    private _images: { [cellId: string]: SpatialCell };
    private _tiles: { [cellId: string]: Object3D };

    private _cameraVisualizationMode: CameraVisualizationMode;
    private _cameraSize: number;
    private _pointSize: number;
    private _pointsVisible: boolean;
    private _positionMode: OriginalPositionMode;
    private _tilesVisible: boolean;

    private readonly _rayNearScale: number;
    private readonly _originalPointSize: number;
    private readonly _originalCameraSize: number;

    private _hoveredImage: string;
    private _selectedImage: string;

    private _filter: FilterFunction;

    private _imageCellMap: Map<string, string>;

    private _colors: { hover: string, select: string };

    constructor(
        configuration: SpatialConfiguration,
        scene?: Scene) {
        this._rayNearScale = 1.1;
        this._originalPointSize = 2;
        this._originalCameraSize = 2;

        this._imageCellMap = new Map();

        this._scene = !!scene ? scene : new Scene();
        this._scene.autoUpdate = false;
        this._intersection = new SpatialIntersection();
        this._assets = new SpatialAssets();

        this._needsRender = false;
        this._images = {};
        this._tiles = {};
        this._tileClusters = {};
        this._clusters = {};

        this._cameraVisualizationMode =
            !!configuration.cameraVisualizationMode ?
                configuration.cameraVisualizationMode :
                CameraVisualizationMode.Homogeneous;

        this._cameraSize = configuration.cameraSize;
        this._pointSize = configuration.pointSize;
        this._pointsVisible = configuration.pointsVisible;
        this._positionMode = configuration.originalPositionMode;
        this._tilesVisible = configuration.tilesVisible;

        this._hoveredImage = null;
        this._selectedImage = null;
        this._colors = { hover: "#FF0000", select: "#FF8000" };

        this._filter = () => true;
    }

    public get needsRender(): boolean { return this._needsRender; }
    public get intersection(): SpatialIntersection {
        return this._intersection;
    }

    public addCluster(
        reconstruction: ClusterContract,
        translation: number[],
        cellId: string): void {

        if (this.hasCluster(reconstruction.id, cellId)) {
            return;
        }

        const clusterId = reconstruction.id;

        if (!(clusterId in this._clusters)) {
            this._clusters[clusterId] = {
                points: new Object3D(),
                tiles: [],
            };

            const visible = this._getClusterVisible(clusterId);
            this._clusters[clusterId].points.visible = visible;
            this._clusters[clusterId].points.add(
                new ClusterPoints({
                    cluster: reconstruction,
                    originalSize: this._originalPointSize,
                    scale: this._pointSize,
                    translation,
                }));

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

    public addImage(
        image: Image,
        transform: Transform,
        originalPosition: number[],
        cellId: string): void {

        const key = image.id;
        const idMap = {
            clusterId: image.clusterId ?? NO_CLUSTER_ID,
            sequenceId: image.sequenceId ?? NO_SEQUENCE_ID,
            ccId: image.mergeId ?? NO_MERGE_ID,
        };

        if (!(cellId in this._images)) {
            const created = new SpatialCell(
                cellId,
                this._scene,
                this._intersection);
            created.cameras.visible =
                isModeVisible(this._cameraVisualizationMode);
            created.applyPositionMode(this._positionMode);
            this._images[cellId] = created;
        }

        const cell = this._images[cellId];
        if (cell.hasImage(key)) { return; }
        cell.addImage({ idMap, image: image });

        const colorId = cell.getColorId(key, this._cameraVisualizationMode);
        const color = this._assets.getColor(colorId);
        const visible = this._filter(image);
        cell.visualize({
            id: image.id,
            color,
            positionMode: this._positionMode,
            scale: this._cameraSize,
            transform,
            visible,
            maxSize: this._originalCameraSize,
            originalPosition
        });

        this._imageCellMap.set(key, cellId);
        if (key === this._selectedImage) {
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

    public addTile(vertices: number[][], cellId: string): void {
        if (this.hasTile(cellId)) {
            return;
        }

        const tile = new TileLine(vertices);
        this._tiles[cellId] = new Object3D();
        this._tiles[cellId].visible = this._tilesVisible;
        this._tiles[cellId].add(tile);
        this._scene.add(this._tiles[cellId]);

        this._needsRender = true;
    }

    public hasCluster(clusterId: string, cellId: string): boolean {
        return clusterId in this._clusters &&
            this._clusters[clusterId].tiles.indexOf(cellId) !== -1;
    }

    public hasTile(cellId: string): boolean {
        return cellId in this._tiles;
    }

    public hasImage(key: string, cellId: string): boolean {
        return cellId in this._images &&
            this._images[cellId].hasImage(key);
    }

    public setCameraSize(cameraSize: number): void {
        if (Math.abs(cameraSize - this._cameraSize) < 1e-3) { return; }

        const imageCells = this._images;
        for (const cellId of Object.keys(imageCells)) {
            imageCells[cellId].applyCameraSize(cameraSize);
        }

        this._intersection.raycaster.near = this._getNear(cameraSize);
        this._cameraSize = cameraSize;
        this._needsRender = true;
    }

    public setFilter(filter: FilterFunction): void {
        this._filter = filter;
        const clusterVisibles: { [key: string]: boolean } = {};
        for (const imageCell of Object.values(this._images)) {
            imageCell.applyFilter(filter);
            const imageCV = imageCell.clusterVisibles
            for (const clusterId in imageCV) {
                if (!imageCV.hasOwnProperty(clusterId)) {
                    continue;
                }
                if (!(clusterId in clusterVisibles)) {
                    clusterVisibles[clusterId] = false;
                }
                clusterVisibles[clusterId] ||= imageCV[clusterId];
            }
        }

        const pointsVisible = this._pointsVisible;
        for (const clusterId in clusterVisibles) {
            if (!clusterVisibles.hasOwnProperty(clusterId)) { continue; }
            clusterVisibles[clusterId] &&= pointsVisible
            const visible = clusterVisibles[clusterId];
            if (clusterId in this._clusters) {
                this._clusters[clusterId].points.visible = visible;
            }
        }

        this._needsRender = true;
    }

    public setHoveredImage(key: string | null): void {
        if (key != null && !this._imageCellMap.has(key)) {
            throw new MapillaryError(`Image does not exist: ${key}`);
        }

        if (this._hoveredImage === key) { return; }
        this._needsRender = true;

        if (this._hoveredImage != null) {
            if (this._hoveredImage === this._selectedImage) {
                this._highlight(
                    this._hoveredImage,
                    this._colors.select,
                    this._cameraVisualizationMode);
            } else {
                this._resetCameraColor(this._hoveredImage);
            }
        }

        this._highlight(
            key,
            this._colors.hover,
            this._cameraVisualizationMode);

        this._hoveredImage = key;
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

        for (const clusterId in this._clusters) {
            if (!this._clusters.hasOwnProperty(clusterId)) {
                continue;
            }

            this._clusters[clusterId].points.visible = visible;
        }

        this._pointsVisible = visible;
        this._needsRender = true;

    }

    public setPositionMode(mode: OriginalPositionMode): void {
        if (mode === this._positionMode) { return; }
        for (const cell of Object.values(this._images)) {
            cell.applyPositionMode(mode);
        }
        this._positionMode = mode;
        this._needsRender = true;
    }

    public setSelectedImage(key: string | null): void {
        if (this._selectedImage === key) { return; }
        this._needsRender = true;

        if (this._selectedImage != null) {
            this._resetCameraColor(this._selectedImage);
        }

        this._highlight(
            key,
            this._colors.select,
            this._cameraVisualizationMode);

        this._selectedImage = key;
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

        const visible = isModeVisible(mode);
        const assets = this._assets;
        for (const cell of Object.values(this._images)) {
            cell.cameras.visible = visible;
            const cameraMap = cell.getCamerasByMode(mode);
            cameraMap.forEach(
                (cameras, colorId) => {
                    const color = assets.getColor(colorId);
                    for (const camera of cameras) {
                        camera.setColor(color);
                    }
                });
        }

        this._highlight(this._hoveredImage, this._colors.hover, mode);
        this._highlight(this._selectedImage, this._colors.select, mode);

        this._cameraVisualizationMode = mode;
        this._needsRender = true;
    }

    public render(
        camera: PerspectiveCamera,
        renderer: WebGLRenderer): void {
        renderer.render(this._scene, camera);
        this._needsRender = false;
    }

    public uncache(keepCellIds?: string[]): void {
        for (const cellId of Object.keys(this._tileClusters)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            this._disposeReconstruction(cellId);
        }

        for (const cellId of Object.keys(this._images)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }
            const nceMap = this._imageCellMap;
            const keys = this._images[cellId].keys;
            for (const key of keys) {
                nceMap.delete(key);
            }

            this._images[cellId].dispose();
            delete this._images[cellId];
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
        for (const imageCell of Object.values(this._images)) {
            const imageCV = imageCell.clusterVisibles;
            if (!(clusterId in imageCV)) { continue; }
            visible ||= imageCV[clusterId];
        }
        return visible;
    }

    private _disposePoints(cellId: string): void {
        for (const clusterId of this._tileClusters[cellId].keys) {
            if (!(clusterId in this._clusters)) {
                continue;
            }

            const index: number = this._clusters[clusterId].tiles.indexOf(cellId);
            if (index === -1) {
                continue;
            }

            this._clusters[clusterId].tiles.splice(index, 1);

            if (this._clusters[clusterId].tiles.length > 0) {
                continue;
            }

            for (const points of this._clusters[clusterId].points.children.slice()) {
                (<ClusterPoints>points).dispose();
            }

            this._scene.remove(this._clusters[clusterId].points);

            delete this._clusters[clusterId];
        }
    }

    private _disposeReconstruction(cellId: string): void {
        this._disposePoints(cellId);

        delete this._tileClusters[cellId];
    }

    private _disposeTile(cellId: string): void {
        const tile: Object3D = this._tiles[cellId];

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
        const nceMap = this._imageCellMap;
        if (key == null || !nceMap.has(key)) { return; }

        const cellId = nceMap.get(key);
        const cell = this._images[cellId];
        const colorId = cell.getColorId(key, this._cameraVisualizationMode);
        const color = this._assets.getColor(colorId);
        cell.applyCameraColor(key, color);
    }

    private _highlight(
        key: string,
        color: string,
        mode: CameraVisualizationMode): void {
        const nceMap = this._imageCellMap;
        if (key == null || !nceMap.has(key)) { return; }
        const cellId = nceMap.get(key);
        color = mode === CameraVisualizationMode.Homogeneous ?
            color : "#FFFFFF";
        this._images[cellId].applyCameraColor(key, color);
    }
}
