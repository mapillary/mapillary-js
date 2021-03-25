import * as THREE from "three";

import {
    of as observableOf,
    combineLatest as observableCombineLatest,
    empty as observableEmpty,
    Observable,
    Subject,
    Subscription,
} from "rxjs";

import {
    catchError,
    distinctUntilChanged,
    map,
    publishReplay,
    refCount,
    startWith,
    switchMap,
    withLatestFrom,
} from "rxjs/operators";

import * as Geo from "../geo/Geo";

import { LatLon } from "../api/interfaces/LatLon";
import { Spatial } from "../geo/Spatial";
import { Transform } from "../geo/Transform";
import { ViewportCoords } from "../geo/ViewportCoords";
import { LatLonAlt } from "../api/interfaces/LatLonAlt";
import { GraphCalculator } from "../graph/GraphCalculator";
import { GraphService } from "../graph/GraphService";
import { Node } from "../graph/Node";
import { StateService } from "../state/StateService";
import { AnimationFrame } from "../state/interfaces/AnimationFrame";
import { SubscriptionHolder } from "../utils/SubscriptionHolder";
import { CameraType } from "../geo/interfaces/CameraType";
import { isSpherical } from "../geo/Geo";
import { geodeticToEnu } from "../geo/GeoCoords";

enum PanMode {
    Disabled,
    Enabled,
    Started,
}

export class PanService {
    private _graphService: GraphService;
    private _stateService: StateService;
    private _graphCalculator: GraphCalculator;
    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    private _panNodesSubject$: Subject<[Node, Transform, number][]>;
    private _panNodes$: Observable<[Node, Transform, number][]>;
    private _panNodesSubscription: Subscription;
    private _subscriptions: SubscriptionHolder = new SubscriptionHolder();

    private _mode: PanMode;

    constructor(
        graphService: GraphService,
        stateService: StateService,
        enabled?: boolean,
        graphCalculator?: GraphCalculator,
        spatial?: Spatial,
        viewportCoords?: ViewportCoords) {

        this._graphService = graphService;
        this._stateService = stateService;
        this._graphCalculator = graphCalculator ?? new GraphCalculator();
        this._spatial = spatial ?? new Spatial();
        this._viewportCoords = viewportCoords ?? new ViewportCoords();

        this._mode = enabled !== false ?
            PanMode.Enabled : PanMode.Disabled;

        this._panNodesSubject$ = new Subject<[Node, Transform, number][]>();
        this._panNodes$ = this._panNodesSubject$.pipe(
            startWith([]),
            publishReplay(1),
            refCount());

        this._subscriptions.push(this._panNodes$.subscribe());
    }

    public get panNodes$(): Observable<[Node, Transform, number][]> {
        return this._panNodes$;
    }

    public dispose(): void {
        this.stop();

        if (this._panNodesSubscription != null) {
            this._panNodesSubscription.unsubscribe();
        }

        this._subscriptions.unsubscribe();
    }

    public enable(): void {
        if (this._mode !== PanMode.Disabled) {
            return;
        }

        this._mode = PanMode.Enabled;
        this.start();
    }

    public disable(): void {
        if (this._mode === PanMode.Disabled) {
            return;
        }

        this.stop();

        this._mode = PanMode.Disabled;
    }

    public start(): void {
        if (this._mode !== PanMode.Enabled) {
            return;
        }

        const panNodes$: Observable<[Node, Transform, number][]> = this._stateService.currentNode$.pipe(
            switchMap(
                (current: Node): Observable<[Node, Transform, number][]> => {
                    if (!current.merged || isSpherical(current.cameraType)) {
                        return observableOf([]);
                    }

                    const current$: Observable<Node> = observableOf(current);

                    const bounds: LatLon[] = this._graphCalculator.boundingBoxCorners(current.latLon, 20);

                    const adjacent$: Observable<Node[]> = this._graphService
                        .cacheBoundingBox$(bounds[0], bounds[1]).pipe(
                            catchError(
                                (error: Error): Observable<Node> => {
                                    console.error(`Failed to cache periphery bounding box (${current.id})`, error);

                                    return observableEmpty();
                                }),
                            map(
                                (nodes: Node[]): Node[] => {
                                    if (isSpherical(current.cameraType)) {
                                        return [];
                                    }

                                    const potential: Node[] = [];

                                    for (const node of nodes) {
                                        if (node.id === current.id) {
                                            continue;
                                        }

                                        if (node.mergeConnectedComponent !== current.mergeConnectedComponent) {
                                            continue;
                                        }

                                        if (isSpherical(node.cameraType)) {
                                            continue;
                                        }

                                        if (this._distance(node, current) > 4) {
                                            continue;
                                        }

                                        potential.push(node);
                                    }

                                    return potential;
                                }));

                    return observableCombineLatest(current$, adjacent$).pipe(
                        withLatestFrom(this._stateService.reference$),
                        map(
                            ([[cn, adjacent], reference]: [[Node, Node[]], LatLonAlt]): [Node, Transform, number][] => {
                                const currentDirection: THREE.Vector3 = this._spatial.viewingDirection(cn.rotation);
                                const currentTranslation: number[] = Geo.computeTranslation(
                                    { lat: cn.latLon.lat, lon: cn.latLon.lon, alt: cn.computedAltitude },
                                    cn.rotation,
                                    reference);
                                const currentTransform: Transform = this._createTransform(cn, currentTranslation);
                                const currentAzimuthal: number = this._spatial.wrap(
                                    this._spatial.azimuthal(
                                        currentDirection.toArray(),
                                        currentTransform.upVector().toArray()),
                                    0,
                                    2 * Math.PI);

                                const currentProjectedPoints: number[][] = this._computeProjectedPoints(currentTransform);

                                const currentHFov: number = this._computeHorizontalFov(currentProjectedPoints) / 180 * Math.PI;

                                const preferredOverlap: number = Math.PI / 8;
                                let left: [number, Node, Transform, number] = undefined;
                                let right: [number, Node, Transform, number] = undefined;

                                for (const a of adjacent) {
                                    const translation: number[] = Geo.computeTranslation(
                                        { lat: a.latLon.lat, lon: a.latLon.lon, alt: a.computedAltitude },
                                        a.rotation,
                                        reference);

                                    const transform: Transform = this._createTransform(a, translation);
                                    const projectedPoints: number[][] = this._computeProjectedPoints(transform);
                                    const hFov: number = this._computeHorizontalFov(projectedPoints) / 180 * Math.PI;

                                    const direction: THREE.Vector3 = this._spatial.viewingDirection(a.rotation);
                                    const azimuthal: number = this._spatial.wrap(
                                        this._spatial.azimuthal(
                                            direction.toArray(),
                                            transform.upVector().toArray()),
                                        0,
                                        2 * Math.PI);

                                    const directionChange: number = this._spatial.angleBetweenVector2(
                                        currentDirection.x,
                                        currentDirection.y,
                                        direction.x,
                                        direction.y);

                                    let overlap: number = Number.NEGATIVE_INFINITY;
                                    if (directionChange > 0) {
                                        if (currentAzimuthal > azimuthal) {
                                            overlap = currentAzimuthal - 2 * Math.PI + currentHFov / 2 - (azimuthal - hFov / 2);
                                        } else {
                                            overlap = currentAzimuthal + currentHFov / 2 - (azimuthal - hFov / 2);
                                        }
                                    } else {
                                        if (currentAzimuthal < azimuthal) {
                                            overlap = azimuthal + hFov / 2 - (currentAzimuthal + 2 * Math.PI - currentHFov / 2);
                                        } else {
                                            overlap = azimuthal + hFov / 2 - (currentAzimuthal - currentHFov / 2);
                                        }
                                    }

                                    const nonOverlap: number = Math.abs(hFov - overlap);

                                    const distanceCost: number = this._distance(a, cn);
                                    const timeCost: number = Math.min(this._timeDifference(a, cn), 4);
                                    const overlapCost: number = 20 * Math.abs(overlap - preferredOverlap);
                                    const fovCost: number = Math.min(5, 1 / Math.min(hFov / currentHFov, 1));
                                    const nonOverlapCost: number = overlap > 0 ? -2 * nonOverlap : 0;

                                    const cost: number = distanceCost + timeCost + overlapCost + fovCost + nonOverlapCost;

                                    if (overlap > 0 &&
                                        overlap < 0.5 * currentHFov &&
                                        overlap < 0.5 * hFov &&
                                        nonOverlap > 0.5 * currentHFov) {

                                        if (directionChange > 0) {
                                            if (!left) {
                                                left = [cost, a, transform, hFov];
                                            } else {
                                                if (cost < left[0]) {
                                                    left = [cost, a, transform, hFov];
                                                }
                                            }
                                        } else {
                                            if (!right) {
                                                right = [cost, a, transform, hFov];
                                            } else {
                                                if (cost < right[0]) {
                                                    right = [cost, a, transform, hFov];
                                                }
                                            }
                                        }
                                    }
                                }

                                const panNodes: [Node, Transform, number][] = [];

                                if (!!left) {
                                    panNodes.push([left[1], left[2], left[3]]);
                                }

                                if (!!right) {
                                    panNodes.push([right[1], right[2], right[3]]);
                                }

                                return panNodes;
                            }),
                        startWith([]));
                }));

        this._panNodesSubscription = this._stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): boolean => {
                    return frame.state.nodesAhead > 0;
                }),
            distinctUntilChanged(),
            switchMap(
                (traversing: boolean): Observable<[Node, Transform, number][]> => {
                    return traversing ? observableOf([]) : panNodes$;
                }))
            .subscribe(
                (panNodes: [Node, Transform, number][]): void => {
                    this._panNodesSubject$.next(panNodes);
                });

        this._mode = PanMode.Started;
    }

    public stop(): void {
        if (this._mode !== PanMode.Started) {
            return;
        }

        this._panNodesSubscription.unsubscribe();
        this._panNodesSubject$.next([]);

        this._mode = PanMode.Enabled;
    }

    private _distance(node: Node, reference: Node): number {
        const [x, y, z] = geodeticToEnu(
            node.latLon.lat,
            node.latLon.lon,
            node.computedAltitude,
            reference.latLon.lat,
            reference.latLon.lon,
            reference.computedAltitude);

        return Math.sqrt(x * x + y * y + z * z);
    }

    private _timeDifference(node: Node, reference: Node): number {
        const milliSecond = (1000 * 60 * 60 * 24 * 30);
        return Math.abs(node.capturedAt - reference.capturedAt) / milliSecond;
    }

    private _createTransform(node: Node, translation: number[]): Transform {
        return new Transform(
            node.exifOrientation,
            node.width,
            node.height,
            node.scale,
            node.rotation,
            translation,
            node.assetsCached ? node.image : undefined,
            undefined,
            node.cameraParameters,
            <CameraType>node.cameraType);
    }

    private _computeProjectedPoints(transform: Transform): number[][] {
        const vertices: number[][] = [[1, 0]];
        const directions: number[][] = [[0, 0.5]];
        const pointsPerLine: number = 20;

        return Geo.computeProjectedPoints(transform, vertices, directions, pointsPerLine, this._viewportCoords);
    }

    private _computeHorizontalFov(projectedPoints: number[][]): number {
        const fovs: number[] = projectedPoints
            .map(
                (projectedPoint: number[]): number => {
                    return this._coordToFov(projectedPoint[0]);
                });

        const fov: number = Math.min(...fovs);

        return fov;
    }

    private _coordToFov(x: number): number {
        return 2 * Math.atan(x) * 180 / Math.PI;
    }
}
