import { Subject, Observable, Subscription } from "rxjs";
import { map } from "rxjs/operators";
import * as vd from "virtual-dom";
import * as THREE from "three";

import { ViewportCoords, Transform } from "../../../Geo";
import { ISize } from "../../../Render";
import { RectGeometry, PointsGeometry } from "../Tag";
import { IExtremePointCreateTagOptions } from "../../../Component";

export class ExtremePointCreateTag {
    private _geometry: PointsGeometry;
    private _rectGeometry: RectGeometry;
    private _options: IExtremePointCreateTagOptions;
    private _transform: Transform;
    private _viewportCoords: ViewportCoords;
    private _outline: THREE.Line;

    private _aborted$: Subject<ExtremePointCreateTag>;
    private _created$: Subject<ExtremePointCreateTag>;

    private _geometryChangedSubscription: Subscription;
    private _glObjectsChanged$: Subject<ExtremePointCreateTag>;
    private _glObjects: THREE.Object3D[];

    constructor(
        geometry: PointsGeometry,
        options: IExtremePointCreateTagOptions,
        transform: Transform,
        viewportCoords?: ViewportCoords) {
        this._geometry = geometry;
        this._rectGeometry = new RectGeometry(this._geometry.getRect2d(transform));
        this._options = options;
        this._transform = transform;
        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();
        this._outline = this._createOutine();
        this._glObjects = [this._outline];

        this._aborted$ = new Subject<ExtremePointCreateTag>();
        this._created$ = new Subject<ExtremePointCreateTag>();

        this._glObjectsChanged$ = new Subject<ExtremePointCreateTag>();

        this._geometry.changed$
            .subscribe(
                (pointsGeometry: PointsGeometry): void => {
                    this._setRect(pointsGeometry.getRect2d(transform), transform);
                });

        this._geometryChangedSubscription = this._rectGeometry.changed$
            .subscribe(
                (rectGeometry: RectGeometry): void => {
                    this._disposeOutline();
                    this._outline = this._createOutine();
                    this._glObjects = [this._outline];

                    this._glObjectsChanged$.next(this);
                });
    }

    public get geometry(): PointsGeometry {
        return this._geometry;
    }

    public get aborted$(): Observable<ExtremePointCreateTag> {
        return this._aborted$;
    }

    public get created$(): Observable<ExtremePointCreateTag> {
        return this._created$;
    }

    public get glObjects(): THREE.Object3D[] {
        return this._glObjects;
    }

    public get glObjectsChanged$(): Observable<ExtremePointCreateTag> {
        return this._glObjectsChanged$;
    }

    public get geometryChanged$(): Observable<ExtremePointCreateTag> {
        return this._geometry.changed$.pipe(
            map(
                (): ExtremePointCreateTag => {
                    return this;
                }));
    }

    public dispose(): void { /* noop */ }

    public getDOMObjects(camera: THREE.Camera, size: ISize): vd.VNode[] {
        const container: { offsetHeight: number, offsetWidth: number } = {
            offsetHeight: size.height, offsetWidth: size.width,
        };

        const vNodes: vd.VNode[] = [];

        const points2d: number[][] = this._geometry.getPoints2d();
        const firstPoint2d: number[] = points2d[0];

        const abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
            e.stopPropagation();
            this._aborted$.next(this);
        };

        if (firstPoint2d != null) {
            const firstPointCanvas: number[] =
            this._viewportCoords.basicToCanvasSafe(
                firstPoint2d[0],
                firstPoint2d[1],
                container,
                this._transform,
                camera);

            if (firstPointCanvas != null) {
                const firstOnclick: (e: MouseEvent) => void = this._geometry.points.length > 2 ?
                    (e: MouseEvent): void => {
                        e.stopPropagation();
                        this._geometry.removePoint2d(this._geometry.points.length - 1);
                        this._created$.next(this);
                    } :
                    abort;

                const transform: string = this._canvasToTransform(firstPointCanvas);
                const completerProperties: vd.createProperties = {
                    onclick: firstOnclick,
                    style: { transform: transform },
                };

                const firstClass: string = this._geometry.points.length > 2 ?
                    "TagCompleter" :
                    "TagInteractor";

                vNodes.push(vd.h("div." + firstClass, completerProperties, []));
            }
        }

        if (this._geometry.points.length > 2) {
            for (let index: number = 1; index < this.geometry.points.length - 1; index++) {
                const nonModifiedIndex: number = index;
                const [pointX, pointY]: number[] = this._geometry.points[index];
                const pointCanvas: number[] =
                    this._viewportCoords.basicToCanvasSafe(
                        pointX,
                        pointY,
                        container,
                        this._transform,
                        camera);

                if (pointCanvas != null) {
                    const remove: (e: MouseEvent) => void = (e: MouseEvent): void => {
                        e.stopPropagation();
                        this._geometry.removePoint2d(nonModifiedIndex);
                    };

                    const transform: string = this._canvasToTransform(pointCanvas);
                    const completerProperties: vd.createProperties = {
                        onclick: remove,
                        style: { transform: transform },
                    };

                    vNodes.push(vd.h("div.TagInteractor", completerProperties, []));
                }
            }
        }

        for (const point2d of points2d.slice(0, -1)) {
            const pointCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    point2d[0],
                    point2d[1],
                    container,
                    this._transform,
                    camera);

            if (pointCanvas != null) {
                const background: string = this._colorToCss(this._options.color);
                const transform: string = this._canvasToTransform(pointCanvas);

                const pointProperties: vd.createProperties = {
                    style: {
                        background: background,
                        transform: transform,
                    },
                };

                vNodes.push(vd.h("div.TagVertex", pointProperties, []));
            }
        }

        return vNodes;
    }

    public getGLObjects(): THREE.Object3D[] { return []; }

    public getRetrievableObjects(): THREE.Object3D[] { return []; }

    private _colorToCss(color: number): string {
        return "#" + ("000000" + color.toString(16)).substr(-6);
    }

    private _canvasToTransform(canvas: number[]): string {
        const canvasX: number = Math.round(canvas[0]);
        const canvasY: number = Math.round(canvas[1]);
        const transform: string = `translate(-50%,-50%) translate(${canvasX}px,${canvasY}px)`;

        return transform;
    }

    private _setRect(rect: number[], transform: Transform): void {
        const [x0, y0, x1, y1]: number[] = rect;

        this._rectGeometry.setVertex2d(0, [x0, y1], transform);
        this._rectGeometry.setVertex2d(1, [x0, y0], transform);
        this._rectGeometry.setVertex2d(2, [x1, y0], transform);
        this._rectGeometry.setVertex2d(3, [x1, y1], transform);
    }

    private _createOutine(): THREE.Line {
        const polygon3d: number[][] = this._rectGeometry.getPoints3d(this._transform);

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
