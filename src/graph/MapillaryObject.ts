import {ILatLon} from "../Geo";
import {MapillaryRect} from "../Graph";

export class MapillaryObject {
    private _alt: number;
    private _firstSeenAt: number;
    private _latLon: ILatLon;
    private _key: string;
    private _lastSeenAt: number;
    private _rects: MapillaryRect[];
    private _dPackage: string;
    private _value: string;

    constructor(alt: number,
                firstSeenAt: number,
                latLon: ILatLon,
                key: string,
                lastSeenAt: number,
                rects: MapillaryRect[],
                dPackage: string,
                value: string) {
        this._alt = alt;
        this._firstSeenAt = firstSeenAt;
        this._latLon = latLon;
        this._key = key;
        this._lastSeenAt = lastSeenAt;
        this._rects = rects;
        this._dPackage = dPackage;
        this._value = value;
    }

    public get alt(): number {
        return this._alt;
    }

    public get firstSeenAt(): number {
        return this._firstSeenAt;
    }

    public get latLon(): ILatLon {
        return this._latLon;
    }

    public get key(): string {
        return this._key;
    }

    public get lastSeenAt(): number {
        return this._lastSeenAt;
    }

    public get rects(): MapillaryRect[] {
        return this._rects;
    }

    public get dPackage(): string {
        return this._dPackage;
    }

    public get value(): string {
        return this._value;
    }
}

export default MapillaryObject;
