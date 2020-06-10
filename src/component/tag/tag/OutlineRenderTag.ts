import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    InteractionCursor,
    OutlineTag,
    PolygonGeometry,
    RectGeometry,
    TagDomain,
    TagOperation,
    OutlineRenderTagBase,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISize} from "../../../Render";
import {ISpriteAtlas} from "../../../Viewer";

/**
 * @class OutlineRenderTag
 * @classdesc Tag visualizing the properties of an OutlineTag.
 */
export class OutlineRenderTag extends OutlineRenderTagBase<OutlineTag> {
    private _holes: THREE.Line[];

    constructor(tag: OutlineTag, transform: Transform) {
        super(tag, transform);

        this._fill = !transform.gpano ?
            this._createFill() :
            transform.fullPano &&
            tag.domain === TagDomain.TwoDimensional &&
            tag.geometry instanceof PolygonGeometry ?
                this._createFill() :
                null;

        this._holes = this._tag.lineWidth >= 1 ?
            this._createHoles() :
            [];

        this._outline = this._tag.lineWidth >= 1 ?
            this._createOutline() :
            null;
    }

    public dispose(): void {
        super.dispose();

        this._disposeFill();
        this._disposeHoles();
        this._disposeOutline();
    }

    public getDOMObjects(atlas: ISpriteAtlas, camera: THREE.Camera, size: ISize): vd.VNode[] {
        const vNodes: vd.VNode[] = [];
        const isRect: boolean = this._tag.geometry instanceof RectGeometry;
        const isPerspective: boolean = !this._transform.gpano;
        const container: { offsetHeight: number, offsetWidth: number } = {
            offsetHeight: size.height, offsetWidth: size.width,
        };

        if (this._tag.icon != null && (isRect || isPerspective)) {
            const [iconBasicX, iconBasicY]: number[] = this._tag.geometry instanceof RectGeometry ?
                this._tag.geometry.getVertex2d(this._tag.iconIndex) :
                this._tag.geometry.getPoleOfInaccessibility2d();

            const iconCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    iconBasicX,
                    iconBasicY,
                    container,
                    this._transform,
                    camera);

            if (iconCanvas != null) {
                const interact: (e: MouseEvent) => void = (): void => {
                    this._interact$.next({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this._tag });
                };

                if (atlas.loaded) {
                    const sprite: vd.VNode = atlas.getDOMSprite(this._tag.icon, this._tag.iconFloat);
                    const iconCanvasX: number = Math.round(iconCanvas[0]);
                    const iconCanvasY: number = Math.round(iconCanvas[1]);
                    const transform: string = `translate(${iconCanvasX}px,${iconCanvasY}px)`;

                    const click: (e: MouseEvent) => void = (e: MouseEvent): void => {
                        e.stopPropagation();
                        this._tag.click$.next(this._tag);
                    };

                    const properties: vd.createProperties = {
                        onclick: click,
                        onmousedown: interact,
                        style: { transform: transform },
                    };

                    vNodes.push(vd.h("div.TagSymbol", properties, [sprite]));
                }
            }
        } else if (this._tag.text != null && (isRect || isPerspective)) {
            const [textBasicX, textBasicY]: number[] = this._tag.geometry instanceof RectGeometry ?
                this._tag.geometry.getVertex2d(3) :
                this._tag.geometry.getPoleOfInaccessibility2d();

            const textCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    textBasicX,
                    textBasicY,
                    container,
                    this._transform,
                    camera);

            if (textCanvas != null) {
                const textCanvasX: number = Math.round(textCanvas[0]);
                const textCanvasY: number = Math.round(textCanvas[1]);
                const transform: string = this._tag.geometry instanceof RectGeometry ?
                    `translate(${textCanvasX}px,${textCanvasY}px)` :
                    `translate(-50%, -50%) translate(${textCanvasX}px,${textCanvasY}px)`;

                const interact: (e: MouseEvent) => void = (): void => {
                    this._interact$.next({ offsetX: 0, offsetY: 0, operation: TagOperation.None, tag: this._tag });
                };

                const properties: vd.createProperties = {
                    onmousedown: interact,
                    style: {
                        color: this._colorToCss(this._tag.textColor),
                        transform: transform,
                    },
                    textContent: this._tag.text,
                };

                vNodes.push(vd.h("span.TagSymbol", properties, []));
            }
        }

        if (!this._tag.editable) {
            return vNodes;
        }

        const lineColor: string = this._colorToCss(this._tag.lineColor);

        if (this._tag.geometry instanceof RectGeometry) {
            const [centroidBasicX, centroidBasicY]: number[] = this._tag.geometry.getCentroid2d();
            const centroidCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    centroidBasicX,
                    centroidBasicY,
                    container,
                    this._transform,
                    camera);

            if (centroidCanvas != null) {
                const interact: (e: MouseEvent) => void = this._interact(TagOperation.Centroid, "move");
                const centroidCanvasX: number = Math.round(centroidCanvas[0]);
                const centroidCanvasY: number = Math.round(centroidCanvas[1]);
                const transform: string = `translate(-50%, -50%) translate(${centroidCanvasX}px,${centroidCanvasY}px)`;

                const properties: vd.createProperties = {
                    onmousedown: interact,
                    style: { background: lineColor, transform: transform },
                };

                vNodes.push(vd.h("div.TagMover", properties, []));
            }
        }

        const vertices2d: number[][] = this._tag.geometry.getVertices2d();

        for (let i: number = 0; i < vertices2d.length - 1; i++) {
            if (isRect &&
                ((this._tag.icon != null && i === this._tag.iconIndex) ||
                (this._tag.icon == null && this._tag.text != null && i === 3))) {
                continue;
            }

            const [vertexBasicX, vertexBasicY]: number[] = vertices2d[i];
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

            const cursor: InteractionCursor = isRect ?
                 i % 2 === 0 ? "nesw-resize" : "nwse-resize" :
                 "crosshair";

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

        for (const hole of this._holes) {
            glObjects.push(hole);
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
        if (this._fill != null) {
            this._updateFillGeometry();
        }

        if (this._holes.length > 0) {
            this._updateHoleGeometries();
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
                this._holes = this._createHoles();
                this._outline = this._createOutline();
                glObjectsChanged = true;
            }
        } else {
            this._updateHoleMaterials();
            this._updateOutlineMaterial();
        }

        return glObjectsChanged;
    }

    protected _getPoints3d(): number[][] {
        return this._in3dDomain() ?
            (<PolygonGeometry>this._tag.geometry).getVertices3d(this._transform) :
            this._tag.geometry.getPoints3d(this._transform);
    }

    protected _getTriangles(): number[] {
        return this._in3dDomain() ?
            (<PolygonGeometry>this._tag.geometry).get3dDomainTriangles3d(this._transform) :
            this._tag.geometry.getTriangles3d(this._transform);
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

    private _createHoles(): THREE.Line[] {
        let holes: THREE.Line[] = [];

        if (this._tag.geometry instanceof PolygonGeometry) {
            let holes3d: number[][][] = this._getHoles3d();

            for (let holePoints3d of holes3d) {
                let hole: THREE.Line = this._createLine(holePoints3d);
                holes.push(hole);
            }
        }

        return holes;
    }

    private _disposeHoles(): void {
        for (let hole of this._holes) {
            hole.geometry.dispose();
            (<THREE.Material>hole.material).dispose();
        }

        this._holes = [];
    }

    private _getHoles3d(): number[][][] {
        const polygonGeometry: PolygonGeometry = <PolygonGeometry>this._tag.geometry;

        return this._in3dDomain() ?
            polygonGeometry.getHoleVertices3d(this._transform) :
            polygonGeometry.getHolePoints3d(this._transform);
    }

    private _in3dDomain(): boolean {
        return this._tag.geometry instanceof PolygonGeometry && this._tag.domain === TagDomain.ThreeDimensional;
    }

    private _updateHoleGeometries(): void {
        let holes3d: number[][][] = this._getHoles3d();

        if (holes3d.length !== this._holes.length) {
            throw new Error("Changing the number of holes is not supported.");
        }

        for (let i: number = 0; i < this._holes.length; i++) {
            let holePoints3d: number[][] = holes3d[i];
            let hole: THREE.Line = this._holes[i];

            this._updateLine(hole, holePoints3d);
        }
    }

    private _updateHoleMaterials(): void {
        for (const hole of this._holes) {
            this._updateLineBasicMaterial(<THREE.LineBasicMaterial>hole.material);
        }
    }

    private _updateOutlineMaterial(): void {
        this._updateLineBasicMaterial(<THREE.LineBasicMaterial>this._outline.material);
    }
}
