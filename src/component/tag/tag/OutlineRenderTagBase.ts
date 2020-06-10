import * as THREE from "three";
import * as vd from "virtual-dom";

import {Subscription} from "rxjs";

import {
    InteractionCursor,
    RenderTag,
    TagOperation,
    Tag,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISize} from "../../../Render";
import {ISpriteAtlas} from "../../../Viewer";

export abstract class OutlineRenderTagBase<T extends Tag> extends RenderTag<T> {
    protected _fill: THREE.Mesh;
    protected _outline: THREE.Line;

    private _changedSubscription: Subscription;
    private _geometryChangedSubscription: Subscription;

    constructor(tag: T, transform: Transform) {
        super(tag, transform);

        this._geometryChangedSubscription = this._tag.geometry.changed$
            .subscribe(
                (): void => {
                    this._onGeometryChanged();
                });

        this._changedSubscription = this._tag.changed$
            .subscribe(
                (): void => {
                    const glObjectsChanged: boolean = this._onTagChanged();

                    if (glObjectsChanged) {
                        this._glObjectsChanged$.next(this);
                    }
                });
    }

    public dispose(): void {
        this._changedSubscription.unsubscribe();
        this._geometryChangedSubscription.unsubscribe();
    }

    public abstract getDOMObjects(atlas: ISpriteAtlas, camera: THREE.Camera, size: ISize): vd.VNode[];

    public abstract getGLObjects(): THREE.Object3D[];

    public abstract getRetrievableObjects(): THREE.Object3D[];

    protected abstract _getPoints3d(): number[][];

    protected abstract _getTriangles(): number[];

    protected abstract _onGeometryChanged(): void;

    protected abstract _onTagChanged(): boolean;

    protected abstract _updateLineBasicMaterial(material: THREE.LineBasicMaterial): void;

    protected abstract _updateFillMaterial(material: THREE.MeshBasicMaterial): void;

    protected _colorToCss(color: number): string {
        return "#" + ("000000" + color.toString(16)).substr(-6);
    }

    protected _createFill(): THREE.Mesh {
        let triangles: number[] = this._getTriangles();
        let positions: Float32Array = new Float32Array(triangles);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.computeBoundingSphere();

        let material: THREE.MeshBasicMaterial =
            new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true });

        this._updateFillMaterial(material);

        return new THREE.Mesh(geometry, material);
    }

    protected _createLine(points3d: number[][]): THREE.Line {
        let positions: Float32Array = this._getLinePositions(points3d);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.computeBoundingSphere();

        let material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial();
        this._updateLineBasicMaterial(material);

        const line: THREE.Line = new THREE.Line(geometry, material);
        line.renderOrder = 1;

        return line;
    }

    protected _createOutline(): THREE.Line {
        return this._createLine(this._getPoints3d());
    }

    protected _disposeFill(): void {
        if (this._fill == null) {
            return;
        }

        this._fill.geometry.dispose();
        (<THREE.Material>this._fill.material).dispose();
        this._fill = null;
    }

    protected _disposeOutline(): void {
        if (this._outline == null) {
            return;
        }

        this._outline.geometry.dispose();
        (<THREE.Material>this._outline.material).dispose();
        this._outline = null;
    }

    protected _getLinePositions(points3d: number[][]): Float32Array {
        let length: number = points3d.length;
        let positions: Float32Array = new Float32Array(length * 3);

        for (let i: number = 0; i < length; ++i) {
            let index: number = 3 * i;
            let position: number[] = points3d[i];

            positions[index + 0] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        return positions;
    }

    protected _interact(operation: TagOperation, cursor?: InteractionCursor, vertexIndex?: number): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
            let offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
            let offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

            this._interact$.next({
                cursor: cursor,
                offsetX: offsetX,
                offsetY: offsetY,
                operation: operation,
                tag: this._tag,
                vertexIndex: vertexIndex,
            });
        };
    }

    protected _updateFillGeometry(): void {
        let triangles: number[] = this._getTriangles();
        let positions: Float32Array = new Float32Array(triangles);

        let geometry: THREE.BufferGeometry = <THREE.BufferGeometry>this._fill.geometry;
        let attribute: THREE.BufferAttribute = <THREE.BufferAttribute>geometry.getAttribute("position");

        if (attribute.array.length === positions.length) {
            attribute.set(positions);
            attribute.needsUpdate = true;
        } else {
            geometry.removeAttribute("position");
            geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        }

        geometry.computeBoundingSphere();
    }

    protected _updateLine(line: THREE.Line, points3d: number[][]): void {
        let positions: Float32Array = this._getLinePositions(points3d);

        let geometry: THREE.BufferGeometry = <THREE.BufferGeometry>line.geometry;
        let attribute: THREE.BufferAttribute = <THREE.BufferAttribute>geometry.getAttribute("position");

        attribute.set(positions);
        attribute.needsUpdate = true;

        geometry.computeBoundingSphere();
    }

    protected _updateOulineGeometry(): void {
        this._updateLine(this._outline, this._getPoints3d());
    }
}

export default OutlineRenderTagBase;
