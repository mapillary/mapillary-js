/// <reference path="../../../typings/index.d.ts" />

import * as rbush from "rbush";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {
    IMarkerIndexItem,
    Marker,
} from "../../Component";

interface IMarkerData {
    hash: { [id: string]: IMarkerIndexItem };
    index: MarkerIndex;
}

interface IMarkerOperation extends Function {
    (data: IMarkerData): IMarkerData;
}

export type MarkerIndex = rbush.RBush<IMarkerIndexItem>;

export class MarkerSet {
    private _add$: Subject<Marker> = new Subject<Marker>();
    private _remove$: Subject<string> = new Subject<string>();
    private _update$: Subject<IMarkerOperation> = new Subject<IMarkerOperation>();
    private _markerIndex$: Observable<MarkerIndex>;

    constructor() {
        this._markerIndex$ = this._update$
            .scan(
                (markers: IMarkerData, operation: IMarkerOperation): IMarkerData => {
                    return operation(markers);
                },
                {hash: {}, index: rbush<IMarkerIndexItem>(16, [".lon", ".lat", ".lon", ".lat"])})
            .map(
                (markers: IMarkerData): MarkerIndex => {
                    return markers.index;
                })
            .publishReplay(1)
            .refCount();

        this._add$
            .map(
                (marker: Marker): IMarkerOperation => {
                    return (markers: IMarkerData) => {
                        if (markers.hash[marker.id]) {
                            markers.index.remove(markers.hash[marker.id]);
                        }

                        let item: IMarkerIndexItem = {
                            lat: marker.latLonAlt.lat,
                            lon: marker.latLonAlt.lon,
                            marker: marker,
                        };

                        markers.index.insert(item);
                        markers.hash[marker.id] = item;

                        return markers;
                    };
                })
            .subscribe(this._update$);

        this._remove$
            .map(
                (id: string): IMarkerOperation => {
                    return (markers: IMarkerData) => {
                        let item: IMarkerIndexItem = markers.hash[id];
                        markers.index.remove(item);
                        delete markers.hash[id];

                        return markers;
                    };
                })
            .subscribe(this._update$);
    }

    public add(marker: Marker): void {
        this._add$.next(marker);
    }

    public remove(id: string): void {
        this._remove$.next(id);
    }

    public get markerIndex$(): Observable<MarkerIndex> {
        return this._markerIndex$;
    }
}

export default MarkerSet;
