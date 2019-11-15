import * as THREE from "three";
import * as vd from "virtual-dom";

import {Subscription} from "rxjs";

import {
    InteractionCursor,
    OutlineTag,
    PolygonGeometry,
    RectGeometry,
    RenderTag,
    TagDomain,
    TagOperation,
    ExtremePointTag,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISize} from "../../../Render";
import {ISpriteAtlas} from "../../../Viewer";
import PointsGeometry from "../geometry/PointsGeometry";

/**
 * @class OutlineRenderTag
 * @classdesc Tag visualizing the properties of an OutlineTag.
 */
export class ExtremePointRenderTag extends RenderTag<ExtremePointTag> {
    private _rectGeometry: RectGeometry;

    private _fill: THREE.Mesh;
    private _outline: THREE.Line;

    private _changedSubscription: Subscription;
    private _geometryChangedSubscription: Subscription;

    constructor(tag: ExtremePointTag, transform: Transform) {
        super(tag, transform);

        this._rectGeometry = new RectGeometry(this._tag.geometry.getRect2d(transform));

        this._fill = !transform.gpano ?
            this._createFill() : null;

        this._outline = this._tag.lineWidth >= 1 ?
            this._createOutline() :
            null;

        this._geometryChangedSubscription = this._tag.geometry.changed$
            .subscribe(
                (geometry: PointsGeometry): void => {
                    this._rectGeometry = new RectGeometry(geometry.getRect2d(transform));

                    if (this._fill != null) {
                        this._updateFillGeometry();
                    }

                    if (this._outline != null) {
                        this._updateOulineGeometry();
                    }
                });

        this._changedSubscription = this._tag.changed$
            .subscribe(
                (): void => {
                    let glObjectsChanged: boolean = false;

                    if (this._fill != null) {
                        this._updateFillMaterial(<THREE.MeshBasicMaterial>this._fill.material);
                    }

                    if (this._outline == null) {
                        if (this._tag.lineWidth >= 1) {
                            this._outline = this._createOutline();
                            glObjectsChanged = true;
                        }
                    } else {
                        this._updateOutlineMaterial();
                    }

                    if (glObjectsChanged) {
                        this._glObjectsChanged$.next(this);
                    }
                });
    }

    public dispose(): void {
        this._disposeFill();
        this._disposeOutline();

        this._changedSubscription.unsubscribe();
        this._geometryChangedSubscription.unsubscribe();
    }

    public getDOMObjects(atlas: ISpriteAtlas, camera: THREE.Camera, size: ISize): vd.VNode[] {
        const vNodes: vd.VNode[] = [];
        const container: { offsetHeight: number, offsetWidth: number } = {
            offsetHeight: size.height, offsetWidth: size.width,
        };

        if (!this._tag.editable) {
            return vNodes;
        }

        const lineColor: string = this._colorToCss(this._tag.lineColor);

        const points2d: number[][] = this._tag.geometry.getPoints2d();

        for (let i: number = 0; i < points2d.length; i++) {
            const [vertexBasicX, vertexBasicY]: number[] = points2d[i];
            const vertexCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    vertexBasicX,
                    vertexBasicY,
                    container,
                    this._transform,
                    camera);

            if (vertexCanvas == null) {
                continue;
            }

            const cursor: InteractionCursor = "crosshair";

            const interact: (e: MouseEvent) => void = this._interact(TagOperation.Vertex, cursor, i);
            const vertexCanvasX: number = Math.round(vertexCanvas[0]);
            const vertexCanvasY: number = Math.round(vertexCanvas[1]);
            const transform: string = `translate(-50%, -50%) translate(${vertexCanvasX}px,${vertexCanvasY}px)`;

            const properties: vd.createProperties = {
                onmousedown: interact,
                style: { background: lineColor, transform: transform, cursor: cursor },
            };

            vNodes.push(vd.h("div.TagResizer", properties, []));

            if (!this._tag.indicateVertices) {
                continue;
            }

            const pointProperties: vd.createProperties = {
                style: { background: lineColor, transform: transform },
            };

            vNodes.push(vd.h("div.TagVertex", pointProperties, []));
        }

        return vNodes;
    }

    public getGLObjects(): THREE.Object3D[] {
        const glObjects: THREE.Object3D[] = [];

        if (this._fill != null) {
            glObjects.push(this._fill);
        }

        if (this._outline != null) {
            glObjects.push(this._outline);
        }

        return glObjects;
    }

    public getRetrievableObjects(): THREE.Object3D[] {
        return this._fill != null ? [this._fill] : [];
    }

    private _colorToCss(color: number): string {
        return "#" + ("000000" + color.toString(16)).substr(-6);
    }

    private _createFill(): THREE.Mesh {
        let triangles: number[] = this._getTriangles();
        let positions: Float32Array = new Float32Array(triangles);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.computeBoundingSphere();

        let material: THREE.MeshBasicMaterial =
            new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true });

        this._updateFillMaterial(material);

        return new THREE.Mesh(geometry, material);
    }

    private _createLine(points3d: number[][]): THREE.Line {
        let positions: Float32Array = this._getLinePositions(points3d);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.computeBoundingSphere();

        let material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial();
        this._updateLineBasicMaterial(material);

        const line: THREE.Line = new THREE.Line(geometry, material);
        line.renderOrder = 1;

        return line;
    }

    private _createOutline(): THREE.Line {
        return this._createLine(this._getPoints3d());
    }

    private _disposeFill(): void {
        if (this._fill == null) {
            return;
        }

        this._fill.geometry.dispose();
        (<THREE.Material>this._fill.material).dispose();
        this._fill = null;
    }

    private _disposeOutline(): void {
        if (this._outline == null) {
            return;
        }

        this._outline.geometry.dispose();
        this._outline.material.dispose();
        this._outline = null;
    }

    private _getLinePositions(points3d: number[][]): Float32Array {
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

    private _getPoints3d(): number[][] {
        return this._rectGeometry.getPoints3d(this._transform);
    }

    private _getTriangles(): number[] {
        return []; // this._tag.geometry.getTriangles3d(this._transform);
    }

    private _interact(operation: TagOperation, cursor?: InteractionCursor, vertexIndex?: number): (e: MouseEvent) => void {
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

    private _updateFillGeometry(): void {
        let triangles: number[] = this._getTriangles();
        let positions: Float32Array = new Float32Array(triangles);

        let geometry: THREE.BufferGeometry = <THREE.BufferGeometry>this._fill.geometry;
        let attribute: THREE.BufferAttribute = <THREE.BufferAttribute>geometry.getAttribute("position");

        if (attribute.array.length === positions.length) {
            attribute.set(positions);
            attribute.needsUpdate = true;
        } else {
            geometry.removeAttribute("position");
            geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
        }

        geometry.computeBoundingSphere();
    }

    private _updateFillMaterial(material: THREE.MeshBasicMaterial): void {
        material.color = new THREE.Color(this._tag.fillColor);
        material.opacity = this._tag.fillOpacity;
        material.needsUpdate = true;
    }

    private _updateLine(line: THREE.Line, points3d: number[][]): void {
        let positions: Float32Array = this._getLinePositions(points3d);

        let geometry: THREE.BufferGeometry = <THREE.BufferGeometry>line.geometry;
        let attribute: THREE.BufferAttribute = <THREE.BufferAttribute>geometry.getAttribute("position");

        attribute.set(positions);
        attribute.needsUpdate = true;

        geometry.computeBoundingSphere();
    }

    private _updateOulineGeometry(): void {
        this._updateLine(this._outline, this._getPoints3d());
    }

    private _updateOutlineMaterial(): void {
        let material: THREE.LineBasicMaterial = <THREE.LineBasicMaterial>this._outline.material;

        this._updateLineBasicMaterial(material);
    }

    private _updateLineBasicMaterial(material: THREE.LineBasicMaterial): void {
        material.color = new THREE.Color(this._tag.lineColor);
        material.linewidth = Math.max(this._tag.lineWidth, 1);
        material.visible = this._tag.lineWidth >= 1 && this._tag.lineOpacity > 0;
        material.opacity = this._tag.lineOpacity;
        material.transparent = this._tag.lineOpacity < 1;
        material.needsUpdate = true;
    }
}

export default ExtremePointRenderTag;
