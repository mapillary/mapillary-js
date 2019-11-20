import {map} from "rxjs/operators";
import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable, Subject, Subscription} from "rxjs";

import {
    CreateTag,
    IOutlineCreateTagOptions,
    PolygonGeometry,
    RectGeometry,
    VertexGeometry,
} from "../../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../../Geo";
import {ISize} from "../../../Render";

export class OutlineCreateTag extends CreateTag<VertexGeometry> {
    private _outline: THREE.Line;
    private _options: IOutlineCreateTagOptions;

    constructor(
        geometry: VertexGeometry,
        options: IOutlineCreateTagOptions,
        transform: Transform,
        viewportCoords?: ViewportCoords) {

        super(geometry, transform, viewportCoords);

        this._options = { color: options.color == null ? 0xFFFFFF : options.color };

        this._createGlObjects();
    }

    public create(): void {
        if (this._geometry instanceof RectGeometry) {
            this._created$.next(this);
        } else if (this._geometry instanceof PolygonGeometry) {
            const polygonGeometry: PolygonGeometry = <PolygonGeometry>this._geometry;
            polygonGeometry.removeVertex2d(polygonGeometry.polygon.length - 2);
            this._created$.next(this);
        }
    }

    public dispose(): void {
        super.dispose();
        this._disposeLine(this._outline);
        this._disposeObjects();
    }

    public getDOMObjects(camera: THREE.Camera, size: ISize): vd.VNode[] {
        const vNodes: vd.VNode[] = [];
        const container: { offsetHeight: number, offsetWidth: number } = {
            offsetHeight: size.height, offsetWidth: size.width,
        };

        const abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            e.stopPropagation();
            this._aborted$.next(this);
        };

        if (this._geometry instanceof RectGeometry) {
            const anchorIndex: number = (<RectGeometry>this._geometry).anchorIndex;
            const vertexIndex: number = anchorIndex === undefined ? 1 : anchorIndex;
            const [basicX, basicY]: number[] = this._geometry.getVertex2d(vertexIndex);
            const canvasPoint: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    basicX,
                    basicY,
                    container,
                    this._transform,
                    camera);

            if (canvasPoint != null) {
                const background: string = this._colorToBackground(this._options.color);
                const transform: string = this._canvasToTransform(canvasPoint);
                const pointProperties: vd.createProperties = {
                    style: { background: background, transform: transform },
                };

                const completerProperties: vd.createProperties = {
                    onclick: abort,
                    style: { transform: transform },
                };

                vNodes.push(vd.h("div.TagInteractor", completerProperties, []));
                vNodes.push(vd.h("div.TagVertex", pointProperties, []));
            }
        } else if (this._geometry instanceof PolygonGeometry) {
            const polygonGeometry: PolygonGeometry = <PolygonGeometry>this._geometry;

            const [firstVertexBasicX, firstVertexBasicY]: number[] = polygonGeometry.getVertex2d(0);
            const firstVertexCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    firstVertexBasicX,
                    firstVertexBasicY,
                    container,
                    this._transform,
                    camera);

            if (firstVertexCanvas != null) {
                const firstOnclick: (e: MouseEvent) => void = polygonGeometry.polygon.length > 4 ?
                    (e: MouseEvent): void => {
                        e.stopPropagation();
                        polygonGeometry.removeVertex2d(polygonGeometry.polygon.length - 2);
                        this._created$.next(this);
                    } :
                    abort;

                const transform: string = this._canvasToTransform(firstVertexCanvas);
                const completerProperties: vd.createProperties = {
                    onclick: firstOnclick,
                    style: { transform: transform },
                };

                const firstClass: string = polygonGeometry.polygon.length > 4 ?
                    "TagCompleter" :
                    "TagInteractor";

                vNodes.push(vd.h("div." + firstClass, completerProperties, []));
            }

            if (polygonGeometry.polygon.length > 3) {
                const [lastVertexBasicX, lastVertexBasicY]: number[] = polygonGeometry.getVertex2d(polygonGeometry.polygon.length - 3);
                const lastVertexCanvas: number[] =
                    this._viewportCoords.basicToCanvasSafe(
                        lastVertexBasicX,
                        lastVertexBasicY,
                        container,
                        this._transform,
                        camera);

                if (lastVertexCanvas != null) {
                    const remove: (e: MouseEvent) => void = (e: MouseEvent): void => {
                        e.stopPropagation();
                        polygonGeometry.removeVertex2d(polygonGeometry.polygon.length - 3);
                    };

                    const transform: string = this._canvasToTransform(lastVertexCanvas);
                    const completerProperties: vd.createProperties = {
                        onclick: remove,
                        style: { transform: transform },
                    };

                    vNodes.push(vd.h("div.TagInteractor", completerProperties, []));
                }
            }

            const verticesBasic: number[][] = polygonGeometry.polygon.slice();
            verticesBasic.splice(-2, 2);
            for (const vertexBasic of verticesBasic) {
                const vertexCanvas: number[] =
                    this._viewportCoords.basicToCanvasSafe(
                        vertexBasic[0],
                        vertexBasic[1],
                        container,
                        this._transform,
                        camera);

                if (vertexCanvas != null) {
                    const background: string = this._colorToBackground(this._options.color);
                    const transform: string = this._canvasToTransform(vertexCanvas);
                    const pointProperties: vd.createProperties = {
                        style: {
                            background: background,
                            transform: transform,
                        },
                    };

                    vNodes.push(vd.h("div.TagVertex", pointProperties, []));
                }
            }
        }

        return vNodes;
    }

    public addPoint(point: number[]): void {
        if (this._geometry instanceof RectGeometry) {
            const rectGeometry: RectGeometry = <RectGeometry>this._geometry;

            if (!rectGeometry.validate(point)) {
                return;
            }

            this._created$.next(this);
        } else if (this._geometry instanceof PolygonGeometry) {
            const polygonGeometry: PolygonGeometry = <PolygonGeometry>this._geometry;

            polygonGeometry.addVertex2d(point);
        }
    }

    protected _onGeometryChanged(): void {
        this._disposeLine(this._outline);
        this._disposeObjects();

        this._createGlObjects();
    }

    private _disposeObjects(): void {
        this._outline = null;
        this._glObjects = [];
    }

    private _createGlObjects(): void {
        const polygon3d: number[][] = this._geometry instanceof RectGeometry ?
        this._geometry.getPoints3d(this._transform) :
        (<PolygonGeometry>this._geometry).getVertices3d(this._transform);

        this._outline = this._createOutine(polygon3d, this._options.color);
        this._glObjects = [this._outline];
    }
}

export default OutlineCreateTag;
