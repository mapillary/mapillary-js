import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    InteractionCursor,
    RectGeometry,
    TagOperation,
    ExtremePointTag,
    OutlineRenderTagBase,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISize} from "../../../Render";
import {ISpriteAtlas} from "../../../Viewer";

/**
 * @class OutlineRenderTag
 * @classdesc Tag visualizing the properties of an OutlineTag.
 */
export class ExtremePointRenderTag extends OutlineRenderTagBase<ExtremePointTag> {
    private _rectGeometry: RectGeometry;

    constructor(tag: ExtremePointTag, transform: Transform) {
        super(tag, transform);

        this._rectGeometry = new RectGeometry(this._tag.geometry.getRect2d(transform));

        this._fill = !transform.gpano ?
            this._createFill() : null;

        this._outline = this._tag.lineWidth >= 1 ?
            this._createOutline() :
            null;
    }

    public dispose(): void {
        super.dispose();

        this._disposeFill();
        this._disposeOutline();
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

    protected _onGeometryChanged(): void {
        this._rectGeometry = new RectGeometry(this._tag.geometry.getRect2d(this._transform));

        if (this._fill != null) {
            this._updateFillGeometry();
        }

        if (this._outline != null) {
            this._updateOulineGeometry();
        }
    }

    protected _onTagChanged(): boolean {
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

        return glObjectsChanged;
    }

    protected _getPoints3d(): number[][] {
        return this._rectGeometry.getPoints3d(this._transform);
    }

    protected _getTriangles(): number[] {
        return this._rectGeometry.getTriangles3d(this._transform);
    }

    protected _updateFillMaterial(material: THREE.MeshBasicMaterial): void {
        material.color = new THREE.Color(this._tag.fillColor);
        material.opacity = this._tag.fillOpacity;
        material.needsUpdate = true;
    }

    protected _updateLineBasicMaterial(material: THREE.LineBasicMaterial): void {
        material.color = new THREE.Color(this._tag.lineColor);
        material.linewidth = Math.max(this._tag.lineWidth, 1);
        material.visible = this._tag.lineWidth >= 1 && this._tag.lineOpacity > 0;
        material.opacity = this._tag.lineOpacity;
        material.transparent = this._tag.lineOpacity < 1;
        material.needsUpdate = true;
    }

    private _updateOutlineMaterial(): void {
        let material: THREE.LineBasicMaterial = <THREE.LineBasicMaterial>this._outline.material;

        this._updateLineBasicMaterial(material);
    }
}

export default ExtremePointRenderTag;
