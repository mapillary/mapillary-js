/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import {
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

export class OutlineCreateTag {
    private _geometry: VertexGeometry;
    private _outline: THREE.Line;
    private _glObjects: THREE.Object3D[];
    private _options: IOutlineCreateTagOptions;
    private _transform: Transform;
    private _viewportCoords: ViewportCoords;

    private _aborted$: Subject<OutlineCreateTag>;
    private _created$: Subject<OutlineCreateTag>;
    private _glObjectsChanged$: Subject<OutlineCreateTag>;

    private _geometryChangedSubscription: Subscription;

    constructor(geometry: VertexGeometry, options: IOutlineCreateTagOptions, transform: Transform, viewportCoords?: ViewportCoords) {
        this._geometry = geometry;
        this._options = { color: options.color == null ? 0xFFFFFF : options.color };
        this._transform = transform;
        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();

        this._outline = this._createOutine();
        this._glObjects = [this._outline];

        this._aborted$ = new Subject<OutlineCreateTag>();
        this._created$ = new Subject<OutlineCreateTag>();
        this._glObjectsChanged$ = new Subject<OutlineCreateTag>();

        this._geometryChangedSubscription = this._geometry.changed$
            .subscribe(
                (vertexGeometry: VertexGeometry): void => {
                    this._disposeOutline();
                    this._outline = this._createOutine();
                    this._glObjects = [this._outline];

                    this._glObjectsChanged$.next(this);
                });
    }

    public get geometry(): VertexGeometry {
        return this._geometry;
    }

    public get glObjects(): THREE.Object3D[] {
        return this._glObjects;
    }

    public get aborted$(): Observable<OutlineCreateTag> {
        return this._aborted$;
    }

    public get created$(): Observable<OutlineCreateTag> {
        return this._created$;
    }

    public get glObjectsChanged$(): Observable<OutlineCreateTag> {
        return this._glObjectsChanged$;
    }

    public get geometryChanged$(): Observable<OutlineCreateTag> {
        return this._geometry.changed$
            .map(
                (geometry: VertexGeometry): OutlineCreateTag => {
                    return this;
                });
    }

    public dispose(): void {
        this._disposeOutline();
        this._geometryChangedSubscription.unsubscribe();
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
            const [basicX, basicY]: number[] = this._geometry.getVertex2d(1);
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

    private _canvasToTransform(canvas: number[]): string {
        const canvasX: number = Math.round(canvas[0]);
        const canvasY: number = Math.round(canvas[1]);
        const transform: string = `translate(-50%,-50%) translate(${canvasX}px,${canvasY}px)`;

        return transform;
    }

    private _colorToBackground(color: number): string {
        return "#" + ("000000" + color.toString(16)).substr(-6);
    }

    private _createOutine(): THREE.Line {
        const polygon3d: number[][] = this._geometry.getPoints3d(this._transform);
        const positions: Float32Array = this._getLinePositions(polygon3d);

        const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        const material: THREE.LineBasicMaterial =
            new THREE.LineBasicMaterial(
                {
                    color: this._options.color,
                    linewidth: 1,
                });

        return new THREE.Line(geometry, material);
    }

    private _disposeOutline(): void {
        if (this._outline == null) {
            return;
        }

        const line: THREE.Line = this._outline;
        line.geometry.dispose();
        line.material.dispose();
        this._outline = null;
        this._glObjects = [];
    }

    private _getLinePositions(polygon3d: number[][]): Float32Array {
        const length: number = polygon3d.length;
        const positions: Float32Array = new Float32Array(length * 3);

        for (let i: number = 0; i < length; ++i) {
            const index: number = 3 * i;

            const position: number[] = polygon3d[i];

            positions[index] = position[0];
            positions[index + 1] = position[1];
            positions[index + 2] = position[2];
        }

        return positions;
    }
}

export default OutlineCreateTag;
