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

    private _glObjectsChanged$: Subject<ExtremePointCreateTag>;
    private _glObjects: THREE.Object3D[];

    private _geometryChangedSubscription: Subscription;

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

        this._geometryChangedSubscription = this._geometry.changed$
            .subscribe(
                (pointsGeometry: PointsGeometry): void => {
                    this._rectGeometry = new RectGeometry(pointsGeometry.getRect2d(transform));

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

    public dispose(): void {
        this._geometryChangedSubscription.unsubscribe();
        this._disposeOutline();
     }

    public getDOMObjects(camera: THREE.Camera, size: ISize): vd.VNode[] {
        const container: { offsetHeight: number, offsetWidth: number } = {
            offsetHeight: size.height, offsetWidth: size.width,
        };

        const vNodes: vd.VNode[] = [];

        const points2d: number[][] = this._geometry.getPoints2d();
        const length: number = points2d.length;

        for (let index: number = 0; index < length - 1; index++) {
            const nonModifiedIndex: number = index;
            const [pointX, pointY]: number[] = points2d[index];
            const pointCanvas: number[] =
                this._viewportCoords.basicToCanvasSafe(
                    pointX,
                    pointY,
                    container,
                    this._transform,
                    camera);

            if (!pointCanvas) {
                continue;
            }

            const abort: (e: MouseEvent) => void = (e: MouseEvent): void => {
                e.stopPropagation();
                this._aborted$.next(this);
            };

            const remove: (e: MouseEvent) => void = (e: MouseEvent): void => {
                e.stopPropagation();
                this._geometry.removePoint2d(nonModifiedIndex);
            };

            const transform: string = this._canvasToTransform(pointCanvas);
            const completerProperties: vd.createProperties = {
                onclick: index === 0 && length < 3 ? abort : remove,
                style: { transform: transform },
            };

            vNodes.push(vd.h("div.TagInteractor", completerProperties, []));

            const background: string = this._colorToCss(this._options.color);
            const pointProperties: vd.createProperties = {
                style: {
                    background: background,
                    transform: transform,
                },
            };

            vNodes.push(vd.h("div.TagVertex", pointProperties, []));
        }

        if (length > 2) {
            const [centroidX, centroidY]: number[] = this._geometry.getCentroid2d(this._transform);
            const centroidCanvas: number[] =
            this._viewportCoords.basicToCanvasSafe(
                centroidX,
                centroidY,
                container,
                this._transform,
                camera);

            if (!!centroidCanvas) {
                const complete: (e: MouseEvent) => void = (e: MouseEvent): void => {
                    e.stopPropagation();
                    this._geometry.removePoint2d(this._geometry.points.length - 1);
                    this._created$.next(this);
                };

                const transform: string = this._canvasToTransform(centroidCanvas);
                const completerProperties: vd.createProperties = {
                    onclick: complete,
                    style: { transform: transform },
                };

                vNodes.push(vd.h("div.TagCompleter", completerProperties, []));

                const pointProperties: vd.createProperties = {
                    style: {
                        background: "#d7ffd6",
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
