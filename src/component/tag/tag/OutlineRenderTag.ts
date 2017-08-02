/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Subscription} from "rxjs/Subscription";

import {
    Geometry,
    OutlineTag,
    PolygonGeometry,
    RectGeometry,
    RenderTag,
    TagOperation,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISize} from "../../../Render";
import {ISpriteAtlas} from "../../../Viewer";

/**
 * @class OutlineRenderTag
 * @classdesc Tag visualizing the properties of an OutlineTag.
 */
export class OutlineRenderTag extends RenderTag<OutlineTag> {
    private _fill: THREE.Mesh;
    private _holes: THREE.Line[];
    private _outline: THREE.Line;

    private _changedSubscription: Subscription;
    private _geometryChangedSubscription: Subscription;

    constructor(tag: OutlineTag, transform: Transform) {
        super(tag, transform);

        this._fill = this._tag.fillOpacity > 0 && !transform.gpano ?
            this._createFill() :
            null;

        this._holes = this._tag.lineWidth >= 1 ?
            this._createHoles() :
            [];

        this._outline = this._tag.lineWidth >= 1 ?
            this._createOutline() :
            null;

        this._geometryChangedSubscription = this._tag.geometry.changed$
            .subscribe(
                (geometry: Geometry): void => {
                    if (this._fill != null) {
                        this._updateFillGeometry();
                    }

                    if (this._holes.length > 0) {
                        this._updateHoleGeometries();
                    }

                    if (this._outline != null) {
                        this._updateOulineGeometry();
                    }
                });

        this._changedSubscription = this._tag.changed$
            .subscribe(
                (changedTag: OutlineTag): void => {
                    let glObjectsChanged: boolean = false;

                    if (this._fill == null) {
                        if (this._tag.fillOpacity > 0 && !this._transform.gpano) {
                            this._fill = this._createFill();
                            glObjectsChanged = true;
                        }
                    } else {
                        this._updateFillMaterial();
                    }

                    if (this._outline == null) {
                        if (this._tag.lineWidth > 0) {
                            this._holes = this._createHoles();
                            this._outline = this._createOutline();
                            glObjectsChanged = true;
                        }
                    } else {
                        this._updateHoleMaterials();
                        this._updateOutlineMaterial();
                    }

                    if (glObjectsChanged) {
                        this._glObjectsChanged$.next(this);
                    }
                });
    }

    public dispose(): void {
        this._disposeFill();
        this._disposeHoles();
        this._disposeOutline();

        this._changedSubscription.unsubscribe();
        this._geometryChangedSubscription.unsubscribe();
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
                this._tag.geometry.getPoleOfAccessibility2d();

            const iconCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    iconBasicX,
                    iconBasicY,
                    container,
                    this._transform,
                    camera);

            if (iconCanvas != null) {
                const interact: (e: MouseEvent) => void = (e: MouseEvent): void => {
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
                this._tag.geometry.getPoleOfAccessibility2d();

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

                const interact: (e: MouseEvent) => void = (e: MouseEvent): void => {
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
                const interact: (e: MouseEvent) => void = this._interact(TagOperation.Centroid);
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

            const interact: (e: MouseEvent) => void = this._interact(TagOperation.Vertex, i);
            const vertexCanvasX: number = Math.round(vertexCanvas[0]);
            const vertexCanvasY: number = Math.round(vertexCanvas[1]);
            const transform: string = `translate(-50%, -50%) translate(${vertexCanvasX}px,${vertexCanvasY}px)`;

            const properties: vd.createProperties = {
                onmousedown: interact,
                style: { background: lineColor, transform: transform },
            };

            if (isRect) {
                properties.style.cursor = i % 2 === 0 ? "nesw-resize" : "nwse-resize";
            }

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

    private _colorToCss(color: number): string {
        return "#" + ("000000" + color.toString(16)).substr(-6);
    }

    private _createFill(): THREE.Mesh {
        let triangles: number[] = this._tag.geometry.getTriangles3d(this._transform);
        let positions: Float32Array = new Float32Array(triangles);

        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.computeBoundingSphere();

        let material: THREE.MeshBasicMaterial =
            new THREE.MeshBasicMaterial(
                {
                    color: this._tag.fillColor,
                    opacity: this._tag.fillOpacity,
                    side: THREE.DoubleSide,
                    transparent: true,
                });

        return new THREE.Mesh(geometry, material);
    }

    private _createHoles(): THREE.Line[] {
        let holes: THREE.Line[] = [];

        if (this._tag.geometry instanceof PolygonGeometry) {
            let polygonGeometry: PolygonGeometry = <PolygonGeometry>this._tag.geometry;
            let holes3d: number[][][] = polygonGeometry.getHoleVertices3d(this._transform);

            for (let holePoints3d of holes3d) {
                let hole: THREE.Line = this._createLine(holePoints3d);
                holes.push(hole);
            }
        }

        return holes;
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
        let points3d: number[][] = this._tag.geometry.getPoints3d(this._transform);
        return this._createLine(points3d);
    }

    private _disposeFill(): void {
        if (this._fill == null) {
            return;
        }

        this._fill.geometry.dispose();
        this._fill.material.dispose();
        this._fill = null;
    }

    private _disposeHoles(): void {
        for (let hole of this._holes) {
            hole.geometry.dispose();
            hole.material.dispose();
        }

        this._holes = [];
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

    private _interact(operation: TagOperation, vertexIndex?: number): (e: MouseEvent) => void {
        return (e: MouseEvent): void => {
            let offsetX: number = e.offsetX - (<HTMLElement>e.target).offsetWidth / 2;
            let offsetY: number = e.offsetY - (<HTMLElement>e.target).offsetHeight / 2;

            this._interact$.next({
                offsetX: offsetX,
                offsetY: offsetY,
                operation: operation,
                tag: this._tag,
                vertexIndex: vertexIndex,
            });
        };
    }

    private _updateFillGeometry(): void {
        let triangles: number[] = this._tag.geometry.getTriangles3d(this._transform);
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

    private _updateFillMaterial(): void {
        let material: THREE.MeshBasicMaterial = <THREE.MeshBasicMaterial>this._fill.material;

        material.color = new THREE.Color(this._tag.fillColor);
        material.opacity = this._tag.fillOpacity;
        material.needsUpdate = true;
    }

    private _updateHoleGeometries(): void {
        let polygonGeometry: PolygonGeometry = <PolygonGeometry>this._tag.geometry;
        let holes3d: number[][][] = polygonGeometry.getHoleVertices3d(this._transform);

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
        for (let hole of this._holes) {
            let material: THREE.LineBasicMaterial = <THREE.LineBasicMaterial>hole.material;

            this._updateLineBasicMaterial(material);
        }
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
        let points3d: number[][] = this._tag.geometry.getPoints3d(this._transform);

        this._updateLine(this._outline, points3d);
    }

    private _updateOutlineMaterial(): void {
        let material: THREE.LineBasicMaterial = <THREE.LineBasicMaterial>this._outline.material;

        this._updateLineBasicMaterial(material);
    }

    private _updateLineBasicMaterial(material: THREE.LineBasicMaterial): void {
        material.color = new THREE.Color(this._tag.lineColor);
        material.linewidth = Math.max(this._tag.lineWidth, 1);
        material.opacity = this._tag.lineWidth >= 1 ? this._tag.lineOpacity : 0;
        material.transparent = this._tag.lineWidth <= 0 || this._tag.lineOpacity < 1;
        material.needsUpdate = true;
    }
}
