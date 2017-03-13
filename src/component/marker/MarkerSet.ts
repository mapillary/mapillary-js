/// <reference path="../../../typings/index.d.ts" />

import * as rbush from "rbush";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {
    ISpatialMarker,
    Marker,
} from "../../Component";

interface IMarkerData {
    hash: { [id: string]: ISpatialMarker };
    spatial: MarkerIndex;
}

interface IMarkerOperation extends Function {
    (markers: IMarkerData): IMarkerData;
}

type MarkerIndex = rbush.RBush<ISpatialMarker>;

export class MarkerSet {
    private _add$: Subject<Marker> = new Subject<Marker>();
    private _remove$: Subject<string> = new Subject<string>();
    private _update$: Subject<IMarkerOperation> = new Subject<IMarkerOperation>();
    private _markers$: Observable<MarkerIndex>;

    constructor() {
        this._markers$ = this._update$
            .scan(
                (markers: IMarkerData, operation: IMarkerOperation): IMarkerData => {
                    return operation(markers);
                },
                {hash: {}, spatial: rbush<ISpatialMarker>(16, [".lon", ".lat", ".lon", ".lat"])})
            .map(
                (markers: IMarkerData): MarkerIndex => {
                    return markers.spatial;
                })
            .publishReplay(1)
            .refCount();

        this._add$
            .map(
                (marker: Marker): IMarkerOperation => {
                    return (markers: IMarkerData) => {
                        if (markers.hash[marker.id]) {
                            markers.spatial.remove(markers.hash[marker.id]);
                        }

                        let rbushObj: ISpatialMarker = {
                            id: marker.id,
                            lat: marker.latLonAlt.lat,
                            lon: marker.latLonAlt.lon,
                            marker: marker,
                        };

                        markers.spatial.insert(rbushObj);
                        markers.hash[marker.id] = rbushObj;
                        return markers;
                    };
                })
            .subscribe(this._update$);

        this._remove$
            .map(
                (id: string): IMarkerOperation => {
                    return (markers: IMarkerData) => {
                        let rbushObj: ISpatialMarker = markers.hash[id];
                        markers.spatial.remove(rbushObj);
                        delete markers.hash[id];
                        return markers;
                    };
                })
            .subscribe(this._update$);
    }

    public addMarker(marker: Marker): void {
        this._add$.next(marker);
    }

    public removeMarker(id: string): void {
        this._remove$.next(id);
    }

    public get markers$(): Observable<MarkerIndex> {
        return this._markers$;
    }
}

export default MarkerSet;
