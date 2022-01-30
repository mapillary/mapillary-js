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
import { CellLine } from "./scene/CellLine";
import { SpatialIntersection } from "./scene/SpatialIntersection";
import { SpatialCell } from "./scene/SpatialCell";
import { SpatialAssets } from "./scene/SpatialAssets";
import { isModeVisible } from "./Modes";
import { PointVisualizationMode } from "./enums/PointVisualizationMode";
import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { resetEnu } from "./SpatialCommon";

const NO_CLUSTER_ID = "NO_CLUSTER_ID";
const NO_MERGE_ID = "NO_MERGE_ID";
const NO_SEQUENCE_ID = "NO_SEQUENCE_ID";

type Clusters = {
    [id: string]: {
        cellIds: string[];
        points: Object3D;
    };
};

export class SpatialScene {
    private _scene: Scene;
    private _intersection: SpatialIntersection;
    private _assets: SpatialAssets;

    private _needsRender: boolean;

    private _cellClusters: {
        [cellId: string]: { keys: string[]; };
    };
    private _clusters: Clusters;
    private _images: { [cellId: string]: SpatialCell; };
    private _cells: { [cellId: string]: Object3D; };

    private _cameraVisualizationMode: CameraVisualizationMode;
    private _cameraSize: number;
    private _pointSize: number;
    private _pointVisualizationMode: PointVisualizationMode;
    private _positionMode: OriginalPositionMode;
    private _cellsVisible: boolean;

    private readonly _rayNearScale: number;
    private readonly _originalPointSize: number;
    private readonly _originalCameraSize: number;

    private _hoveredId: string;
    private _selectedId: string;

    private _filter: FilterFunction;

    private _imageCellMap: Map<string, string>;

    private _colors: { hover: string, select: string; };

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
        this._cells = {};
        this._cellClusters = {};
        this._clusters = {};

        this._cameraVisualizationMode =
            !!configuration.cameraVisualizationMode ?
                configuration.cameraVisualizationMode :
                CameraVisualizationMode.Homogeneous;
        this._cameraSize = configuration.cameraSize;
        this._pointSize = configuration.pointSize;
        this._pointVisualizationMode =
            !!configuration.pointVisualizationMode ?
                configuration.pointVisualizationMode :
                PointVisualizationMode.Original;
        this._positionMode = configuration.originalPositionMode;
        this._cellsVisible = configuration.cellsVisible;

        this._hoveredId = null;
        this._selectedId = null;
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
                cellIds: [],
            };

            const visible = this._getClusterVisible(clusterId);
            const cluster = this._clusters[clusterId];

            const color = this._pointVisualizationMode === PointVisualizationMode.Cluster ? this._assets.getColor(clusterId) : null;
            const points = new ClusterPoints({
                cluster: reconstruction,
                color,
                originalSize: this._originalPointSize,
                scale: this._pointSize,
                translation,
            });
            cluster.points.visible = visible;
            cluster.points.add(points);
            this._scene.add(cluster.points);
        }

        if (this._clusters[clusterId].cellIds.indexOf(cellId) === -1) {
            this._clusters[clusterId].cellIds.push(cellId);
        }
        if (!(cellId in this._cellClusters)) {
            this._cellClusters[cellId] = { keys: [] };
        }
        if (this._cellClusters[cellId].keys.indexOf(clusterId) === -1) {
            this._cellClusters[cellId].keys.push(clusterId);
        }

        this._needsRender = true;
    }

    public addImage(
        image: Image,
        transform: Transform,
        originalPosition: number[],
        cellId: string): void {

        const imageId = image.id;
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
        if (cell.hasImage(imageId)) { return; }
        cell.addImage({ idMap, image: image });

        const colorId = cell.getColorId(imageId, this._cameraVisualizationMode);
        const color = this._assets.getColor(colorId);
        const visible = this._filter(image);
        cell.visualize({
            id: imageId,
            color,
            positionMode: this._positionMode,
            scale: this._cameraSize,
            transform,
            visible,
            maxSize: this._originalCameraSize,
            originalPosition
        });

        this._imageCellMap.set(imageId, cellId);
        if (imageId === this._selectedId) {
            this._highlight(
                imageId,
                this._colors.select,
                this._cameraVisualizationMode);
        }
        if (idMap.clusterId in this._clusters) {
            const clusterVisible = this._getClusterVisible(idMap.clusterId);
            this._clusters[idMap.clusterId].points.visible = clusterVisible;
        }
        this._needsRender = true;
    }

    public addCell(vertices: number[][], cellId: string): void {
        if (this.hasCell(cellId)) {
            return;
        }

        const cell = new CellLine(vertices);
        this._cells[cellId] = new Object3D();
        this._cells[cellId].visible = this._cellsVisible;
        this._cells[cellId].add(cell);
        this._scene.add(this._cells[cellId]);

        this._needsRender = true;
    }

    public deactivate(): void {
        this._filter = () => true;
        this._selectedId = null;
        this._hoveredId = null;

        this.uncache();
    }

    public hasCluster(clusterId: string, cellId: string): boolean {
        return clusterId in this._clusters &&
            this._clusters[clusterId].cellIds.indexOf(cellId) !== -1;
    }

    public hasCell(cellId: string): boolean {
        return cellId in this._cells;
    }

    public hasImage(imageId: string, cellId: string): boolean {
        return cellId in this._images &&
            this._images[cellId].hasImage(imageId);
    }

    public render(
        camera: PerspectiveCamera,
        renderer: WebGLRenderer): void {
        renderer.render(this._scene, camera);
        this._needsRender = false;
    }

    public resetReference(
        reference: LngLatAlt,
        prevReference: LngLatAlt)
        : void {
        const clusters = this._clusters;
        for (const clusterId in clusters) {
            if (!clusters.hasOwnProperty(clusterId)) {
                continue;
            }
            const cluster = clusters[clusterId];
            cluster.points.position.fromArray(resetEnu(
                reference,
                cluster.points.position.toArray(),
                prevReference));
        }

        const cells = this._cells;
        for (const cellId in cells) {
            if (!cells.hasOwnProperty(cellId)) {
                continue;
            }
            const cell = cells[cellId];
            cell.position.fromArray(resetEnu(
                reference,
                cell.position.toArray(),
                prevReference));
        }

        const images = this._images;
        for (const cellId in images) {
            if (!images.hasOwnProperty(cellId)) {
                continue;
            }
            const spatialCell = images[cellId];
            spatialCell.resetReference(reference, prevReference);
        }
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
        const clusterVisibles: { [key: string]: boolean; } = {};
        for (const imageCell of Object.values(this._images)) {
            imageCell.applyFilter(filter);
            const imageCV = imageCell.clusterVisibles;
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

        const pointsVisible =
            this._pointVisualizationMode !== PointVisualizationMode.Hidden;
        for (const clusterId in clusterVisibles) {
            if (!clusterVisibles.hasOwnProperty(clusterId)) { continue; }
            clusterVisibles[clusterId] &&= pointsVisible;
            const visible = clusterVisibles[clusterId];
            if (clusterId in this._clusters) {
                this._clusters[clusterId].points.visible = visible;
            }
        }

        this._needsRender = true;
    }

    public setHoveredImage(imageId: string | null): void {
        if (imageId != null && !this._imageCellMap.has(imageId)) {
            throw new MapillaryError(`Image does not exist: ${imageId}`);
        }

        if (this._hoveredId === imageId) { return; }
        this._needsRender = true;

        if (this._hoveredId != null) {
            if (this._hoveredId === this._selectedId) {
                this._highlight(
                    this._hoveredId,
                    this._colors.select,
                    this._cameraVisualizationMode);
            } else {
                this._resetCameraColor(this._hoveredId);
            }
        }

        this._highlight(
            imageId,
            this._colors.hover,
            this._cameraVisualizationMode);

        this._hoveredId = imageId;
    }

    public setNavigationState(isOverview: boolean): void {
        this._intersection.resetIntersectionThreshold(isOverview);
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

    public setPointVisualizationMode(mode: PointVisualizationMode): void {
        if (mode === this._pointVisualizationMode) {
            return;
        }

        this._pointVisualizationMode = mode;
        for (const clusterId in this._clusters) {
            if (!this._clusters.hasOwnProperty(clusterId)) {
                continue;
            }

            const cluster = this._clusters[clusterId];
            cluster.points.visible = this._getClusterVisible(clusterId);

            for (const points of cluster.points.children) {
                const color = mode === PointVisualizationMode.Cluster ?
                    this._assets.getColor(clusterId) : null;
                (<ClusterPoints>points).setColor(color);
            }
        }

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

    public setSelectedImage(id: string | null): void {
        if (this._selectedId === id) { return; }
        this._needsRender = true;

        if (this._selectedId != null) {
            this._resetCameraColor(this._selectedId);
        }

        this._highlight(
            id,
            this._colors.select,
            this._cameraVisualizationMode);

        this._selectedId = id;
    }

    public setCellVisibility(visible: boolean): void {
        if (visible === this._cellsVisible) {
            return;
        }

        for (const cellId in this._cells) {
            if (!this._cells.hasOwnProperty(cellId)) {
                continue;
            }

            this._cells[cellId].visible = visible;
        }

        this._cellsVisible = visible;
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

        this._highlight(this._hoveredId, this._colors.hover, mode);
        this._highlight(this._selectedId, this._colors.select, mode);

        this._cameraVisualizationMode = mode;
        this._needsRender = true;
    }

    public uncache(keepCellIds?: string[]): void {
        for (const cellId of Object.keys(this._cellClusters)) {
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

        for (const cellId of Object.keys(this._cells)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            this._disposeCell(cellId);
        }

        this._needsRender = true;
    }

    private _getClusterVisible(clusterId: string): boolean {
        if (this._pointVisualizationMode === PointVisualizationMode.Hidden) {
            return false;
        }
        let visible = false;
        for (const imageCell of Object.values(this._images)) {
            const imageCV = imageCell.clusterVisibles;
            if (!(clusterId in imageCV)) { continue; }
            visible ||= imageCV[clusterId];
        }
        return visible;
    }

    private _disposePoints(cellId: string): void {
        for (const clusterId of this._cellClusters[cellId].keys) {
            if (!(clusterId in this._clusters)) {
                continue;
            }

            const index: number = this._clusters[clusterId].cellIds.indexOf(cellId);
            if (index === -1) {
                continue;
            }

            this._clusters[clusterId].cellIds.splice(index, 1);

            if (this._clusters[clusterId].cellIds.length > 0) {
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

        delete this._cellClusters[cellId];
    }

    private _disposeCell(cellId: string): void {
        const cell = this._cells[cellId];

        for (const line of cell.children.slice()) {
            (<CellLine>line).dispose();
            cell.remove(line);
        }

        this._scene.remove(cell);

        delete this._cells[cellId];
    }

    private _getNear(cameraSize: number): number {
        const near = this._rayNearScale *
            this._originalCameraSize *
            cameraSize;

        return Math.max(1, near);
    }

    private _resetCameraColor(imageId: string): void {
        const nceMap = this._imageCellMap;
        if (imageId == null || !nceMap.has(imageId)) { return; }

        const cellId = nceMap.get(imageId);
        const cell = this._images[cellId];
        const colorId = cell.getColorId(imageId, this._cameraVisualizationMode);
        const color = this._assets.getColor(colorId);
        cell.applyCameraColor(imageId, color);
    }

    private _highlight(
        imageId: string,
        color: string,
        mode: CameraVisualizationMode): void {
        const nceMap = this._imageCellMap;
        if (imageId == null || !nceMap.has(imageId)) { return; }
        const cellId = nceMap.get(imageId);
        color = mode === CameraVisualizationMode.Homogeneous ?
            color : "#FFFFFF";
        this._images[cellId].applyCameraColor(imageId, color);
    }
}
