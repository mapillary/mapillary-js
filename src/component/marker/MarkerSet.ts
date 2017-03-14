/// <reference path="../../../typings/index.d.ts" />

import * as rbush from "rbush";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/map";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";

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
    private _add$: Subject<Marker[]> = new Subject<Marker[]>();
    private _remove$: Subject<string[]> = new Subject<string[]>();

    private _markerIndex$: Observable<MarkerIndex>;
    private _markerIndexOperation$: Subject<IMarkerOperation> = new Subject<IMarkerOperation>();

    constructor() {
        this._markerIndex$ = this._markerIndexOperation$
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
                (markers: Marker[]): IMarkerOperation => {
                    return (data: IMarkerData) => {
                        const items: IMarkerIndexItem[] = [];

                        for (let marker of markers) {
                            if (data.hash[marker.id]) {
                                data.index.remove(data.hash[marker.id]);
                            }

                            let item: IMarkerIndexItem = {
                                lat: marker.latLon.lat,
                                lon: marker.latLon.lon,
                                marker: marker,
                            };

                            data.hash[marker.id] = item;
                            items.push(item);
                        }

                        data.index.load(items);

                        return data;
                    };
                })
            .subscribe(this._markerIndexOperation$);

        this._remove$
            .map(
                (ids: string[]): IMarkerOperation => {
                    return (data: IMarkerData) => {
                        for (let id of ids) {
                            let item: IMarkerIndexItem = data.hash[id];
                            data.index.remove(item);
                            delete data.hash[id];
                        }

                        return data;
                    };
                })
            .subscribe(this._markerIndexOperation$);
    }

    public add(markers: Marker[]): void {
        this._add$.next(markers);
    }

    public remove(ids: string[]): void {
        this._remove$.next(ids);
    }

    public get markerIndex$(): Observable<MarkerIndex> {
        return this._markerIndex$;
    }
}

export default MarkerSet;
