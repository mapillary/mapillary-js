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

import { LngLat } from "../api/interfaces/LngLat";
import { Spatial } from "../geo/Spatial";
import { Transform } from "../geo/Transform";
import { ViewportCoords } from "../geo/ViewportCoords";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { GraphCalculator } from "../graph/GraphCalculator";
import { GraphService } from "../graph/GraphService";
import { Image } from "../graph/Image";
import { StateService } from "../state/StateService";
import { AnimationFrame } from "../state/interfaces/AnimationFrame";
import { SubscriptionHolder } from "../util/SubscriptionHolder";
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

    private _panImagesSubject$: Subject<[Image, Transform, number][]>;
    private _panImages$: Observable<[Image, Transform, number][]>;
    private _panImagesSubscription: Subscription;
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

        this._panImagesSubject$ = new Subject<[Image, Transform, number][]>();
        this._panImages$ = this._panImagesSubject$.pipe(
            startWith([]),
            publishReplay(1),
            refCount());

        this._subscriptions.push(this._panImages$.subscribe());
    }

    public get panImages$(): Observable<[Image, Transform, number][]> {
        return this._panImages$;
    }

    public dispose(): void {
        this.stop();

        if (this._panImagesSubscription != null) {
            this._panImagesSubscription.unsubscribe();
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

        const panImages$ = this._stateService.currentImage$.pipe(
            switchMap(
                (current: Image): Observable<[Image, Transform, number][]> => {
                    if (!current.merged || isSpherical(current.cameraType)) {
                        return observableOf([]);
                    }

                    const current$: Observable<Image> = observableOf(current);

                    const bounds: LngLat[] = this._graphCalculator.boundingBoxCorners(current.lngLat, 20);

                    const adjacent$: Observable<Image[]> = this._graphService
                        .cacheBoundingBox$(bounds[0], bounds[1]).pipe(
                            catchError(
                                (error: Error): Observable<Image> => {
                                    console.error(`Failed to cache periphery bounding box (${current.id})`, error);

                                    return observableEmpty();
                                }),
                            map(
                                (images: Image[]): Image[] => {
                                    if (isSpherical(current.cameraType)) {
                                        return [];
                                    }

                                    const potential: Image[] = [];

                                    for (const image of images) {
                                        if (image.id === current.id) {
                                            continue;
                                        }

                                        if (image.mergeId !== current.mergeId) {
                                            continue;
                                        }

                                        if (isSpherical(image.cameraType)) {
                                            continue;
                                        }

                                        if (this._distance(image, current) > 4) {
                                            continue;
                                        }

                                        potential.push(image);
                                    }

                                    return potential;
                                }));

                    return observableCombineLatest(current$, adjacent$).pipe(
                        withLatestFrom(this._stateService.reference$),
                        map(
                            ([[cn, adjacent], reference]: [[Image, Image[]], LngLatAlt]): [Image, Transform, number][] => {
                                const currentDirection: THREE.Vector3 = this._spatial.viewingDirection(cn.rotation);
                                const currentTranslation: number[] = Geo.computeTranslation(
                                    { lat: cn.lngLat.lat, lng: cn.lngLat.lng, alt: cn.computedAltitude },
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
                                let left: [number, Image, Transform, number] = undefined;
                                let right: [number, Image, Transform, number] = undefined;

                                for (const a of adjacent) {
                                    const translation: number[] = Geo.computeTranslation(
                                        { lat: a.lngLat.lat, lng: a.lngLat.lng, alt: a.computedAltitude },
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

                                const panImagess:
                                    [Image, Transform, number][] = [];

                                if (!!left) {
                                    panImagess.push([left[1], left[2], left[3]]);
                                }

                                if (!!right) {
                                    panImagess.push([right[1], right[2], right[3]]);
                                }

                                return panImagess;
                            }),
                        startWith([]));
                }));

        this._panImagesSubscription = this._stateService.currentState$.pipe(
            map(
                (frame: AnimationFrame): boolean => {
                    return frame.state.imagesAhead > 0;
                }),
            distinctUntilChanged(),
            switchMap(
                (traversing: boolean): Observable<[Image, Transform, number][]> => {
                    return traversing ? observableOf([]) : panImages$;
                }))
            .subscribe(
                (panImages: [Image, Transform, number][]): void => {
                    this._panImagesSubject$.next(panImages);
                });

        this._mode = PanMode.Started;
    }

    public stop(): void {
        if (this._mode !== PanMode.Started) {
            return;
        }

        this._panImagesSubscription.unsubscribe();
        this._panImagesSubject$.next([]);

        this._mode = PanMode.Enabled;
    }

    private _distance(image: Image, reference: Image): number {
        const [x, y, z] = geodeticToEnu(
            image.lngLat.lng,
            image.lngLat.lat,
            image.computedAltitude,
            reference.lngLat.lng,
            reference.lngLat.lat,
            reference.computedAltitude);

        return Math.sqrt(x * x + y * y + z * z);
    }

    private _timeDifference(image: Image, reference: Image): number {
        const milliSecond = (1000 * 60 * 60 * 24 * 30);
        return Math.abs(image.capturedAt - reference.capturedAt) / milliSecond;
    }

    private _createTransform(image: Image, translation: number[]): Transform {
        return new Transform(
            image.exifOrientation,
            image.width,
            image.height,
            image.scale,
            image.rotation,
            translation,
            image.assetsCached ? image.image : undefined,
            undefined,
            image.cameraParameters,
            <CameraType>image.cameraType);
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
