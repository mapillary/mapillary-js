import {map} from "rxjs/operators";
import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable, Subject, Subscription} from "rxjs";

import {
    Geometry,
    PolygonGeometry,
    RectGeometry,
} from "../../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../../Geo";
import { ISize } from "../../../Render";

export abstract class CreateTag<T extends Geometry> {
    protected _geometry: T;

    protected _transform: Transform;
    protected _viewportCoords: ViewportCoords;

    protected _aborted$: Subject<CreateTag<T>>;
    protected _created$: Subject<CreateTag<T>>;

    protected _glObjects: THREE.Object3D[];
    protected _glObjectsChanged$: Subject<CreateTag<T>>;

    protected _geometryChangedSubscription: Subscription;

    constructor(geometry: T, transform: Transform, viewportCoords?: ViewportCoords) {

        this._geometry = geometry;
        this._transform = transform;
        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();

        this._aborted$ = new Subject<CreateTag<T>>();
        this._created$ = new Subject<CreateTag<T>>();
        this._glObjectsChanged$ = new Subject<CreateTag<T>>();

        this._geometryChangedSubscription = this._geometry.changed$
            .subscribe(
                (): void => {
                    this._onGeometryChanged();

                    this._glObjectsChanged$.next(this);
                });
    }

    public get geometry(): T {
        return this._geometry;
    }

    public get glObjects(): THREE.Object3D[] {
        return this._glObjects;
    }

    public get aborted$(): Observable<CreateTag<T>> {
        return this._aborted$;
    }

    public get created$(): Observable<CreateTag<T>> {
        return this._created$;
    }

    public get glObjectsChanged$(): Observable<CreateTag<T>> {
        return this._glObjectsChanged$;
    }

    public get geometryChanged$(): Observable<CreateTag<T>> {
        return this._geometry.changed$.pipe(
            map(
                (): CreateTag<T> => {
                    return this;
                }));
    }

    public abstract getDOMObjects(camera: THREE.Camera, size: ISize): vd.VNode[];

    public abstract create(): void;

    public dispose(): void {
        this._geometryChangedSubscription.unsubscribe();
    }

    protected abstract _onGeometryChanged(): void;

    protected _canvasToTransform(canvas: number[]): string {
        const canvasX: number = Math.round(canvas[0]);
        const canvasY: number = Math.round(canvas[1]);
        const transform: string = `translate(-50%,-50%) translate(${canvasX}px,${canvasY}px)`;

        return transform;
    }

    protected _colorToBackground(color: number): string {
        return "#" + ("000000" + color.toString(16)).substr(-6);
    }

    protected _createOutine(polygon3d: number[][], color: number): THREE.Line {
        const positions: Float32Array = this._getLinePositions(polygon3d);

        const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        const material: THREE.LineBasicMaterial =
            new THREE.LineBasicMaterial(
                {
                    color: color,
                    linewidth: 1,
                });

        return new THREE.Line(geometry, material);
    }

    protected _disposeLine(line: THREE.Line): void {
        if (line == null) {
            return;
        }

        line.geometry.dispose();
        (<THREE.Material>line.material).dispose();
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

export default CreateTag;
