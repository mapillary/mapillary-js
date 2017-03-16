/// <reference path="../../../typings/index.d.ts" />

import * as rbush from "rbush";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/map";
import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";

import {ILatLon} from "../../API";
import {
    IMarkerIndexItem,
    Marker,
} from "../../Component";

export type MarkerIndex = rbush.RBush<IMarkerIndexItem>;

export class MarkerSet {
    private _hash: { [id: string]: IMarkerIndexItem };
    private _index: MarkerIndex;

    private _indexChanged$: Subject<MarkerSet>;
    private _updated$: Subject<Marker[]>;

    constructor() {
        this._hash = {};
        this._index = rbush<IMarkerIndexItem>(16, [".lon", ".lat", ".lon", ".lat"]);

        this._indexChanged$ = new Subject<MarkerSet>();
        this._updated$ = new Subject<Marker[]>();
    }

    public get changed$(): Observable<MarkerSet> {
        return this._indexChanged$;
    }

    public get updated$(): Observable<Marker[]> {
        return this._updated$;
    }

    public add(markers: Marker[]): void {
        const items: IMarkerIndexItem[] = [];
        const updated: Marker[] = [];
        const hash: { [id: string]: IMarkerIndexItem } = this._hash;
        const index: MarkerIndex = this._index;

        for (const marker of markers) {
            const id: string = marker.id;

            if (id in hash) {
                index.remove(hash[id]);
                updated.push(marker);
            }

            const item: IMarkerIndexItem = {
                lat: marker.latLon.lat,
                lon: marker.latLon.lon,
                marker: marker,
            };

            hash[id] = item;
            items.push(item);
        }

        index.load(items);

        if (updated.length > 0) {
            this._updated$.next(updated);
        }

        if (items.length > updated.length) {
            this._indexChanged$.next(this);
        }
    }

    public get(id: string): Marker {
        return id in this._hash ? this._hash[id].marker : undefined;
    }

    public getAll(): Marker[] {
        return this._index
            .all()
            .map(
                (indexItem: IMarkerIndexItem): Marker => {
                    return indexItem.marker;
                });
    }

    public remove(ids: string[]): void {
        const hash: { [id: string]: IMarkerIndexItem } = this._hash;
        const index: MarkerIndex = this._index;

        for (const id of ids) {
            if (!(id in hash)) {
                continue;
            }

            const item: IMarkerIndexItem = hash[id];
            index.remove(item);
            delete hash[id];
        }

        this._indexChanged$.next(this);
    }

    public search([sw, ne]: [ILatLon, ILatLon]): Marker[] {
        return this._index
            .search({ maxX: ne.lon, maxY: ne.lat, minX: sw.lon, minY: sw.lat })
            .map(
                (indexItem: IMarkerIndexItem): Marker => {
                    return indexItem.marker;
                });
    }
}

export default MarkerSet;
