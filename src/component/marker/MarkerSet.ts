import {Observable, Subject} from "rxjs";

import {ILatLon} from "../../API";
import {Marker} from "../../Component";
import { GeoRBush } from "../../Geo";

type MarkerIndexItem = {
    lat: number;
    lon: number;
    marker: Marker;
};

export class MarkerSet {
    private _hash: { [id: string]: MarkerIndexItem };
    private _index: GeoRBush<MarkerIndexItem>;

    private _indexChanged$: Subject<MarkerSet>;
    private _updated$: Subject<Marker[]>;

    constructor() {
        this._hash = {};
        this._index = new GeoRBush<MarkerIndexItem>(16);

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
        const updated: Marker[] = [];
        const hash: { [id: string]: MarkerIndexItem } = this._hash;
        const index: GeoRBush<MarkerIndexItem> = this._index;

        for (const marker of markers) {
            const id: string = marker.id;

            if (id in hash) {
                index.remove(hash[id]);
                updated.push(marker);
            }

            const item: MarkerIndexItem = {
                lat: marker.latLon.lat,
                lon: marker.latLon.lon,
                marker: marker,
            };

            hash[id] = item;
            index.insert(item);
        }

        if (updated.length > 0) {
            this._updated$.next(updated);
        }

        if (markers.length > updated.length) {
            this._indexChanged$.next(this);
        }
    }

    public has(id: string): boolean {
        return id in this._hash;
    }

    public get(id: string): Marker {
        return this.has(id) ? this._hash[id].marker : undefined;
    }

    public getAll(): Marker[] {
        return this._index
            .all()
            .map(
                (indexItem: MarkerIndexItem): Marker => {
                    return indexItem.marker;
                });
    }

    public remove(ids: string[]): void {
        const hash: { [id: string]: MarkerIndexItem } = this._hash;
        const index: GeoRBush<MarkerIndexItem> = this._index;

        let changed: boolean = false;
        for (const id of ids) {
            if (!(id in hash)) {
                continue;
            }

            const item: MarkerIndexItem = hash[id];
            index.remove(item);
            delete hash[id];
            changed = true;
        }

        if (changed) {
            this._indexChanged$.next(this);
        }
    }

    public removeAll(): void {
        this._hash = {};
        this._index.clear();

        this._indexChanged$.next(this);
    }

    public search([sw, ne]: [ILatLon, ILatLon]): Marker[] {
        return this._index
            .search({
                maxX: ne.lat,
                maxY: ne.lon,
                minX: sw.lat,
                minY: sw.lon,
            })
            .map(
                (indexItem: MarkerIndexItem): Marker => {
                    return indexItem.marker;
                });
    }

    public update(marker: Marker): void {
        const hash: { [id: string]: MarkerIndexItem } = this._hash;
        const index: GeoRBush<MarkerIndexItem> = this._index;
        const id: string = marker.id;

        if (!(id in hash)) {
            return;
        }

        index.remove(hash[id]);

        const item: MarkerIndexItem = {
            lat: marker.latLon.lat,
            lon: marker.latLon.lon,
            marker: marker,
        };

        hash[id] = item;
        index.insert(item);
    }
}

export default MarkerSet;
