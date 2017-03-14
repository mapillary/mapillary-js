import {ILatLon} from "../../../API";

export abstract class Marker {
    public visibleInKeys: string[] = [];

    protected _id: string;
    protected _latLon: ILatLon;

    constructor(id: string, latLon: ILatLon) {
        this._id = id;
        this._latLon = latLon;
    }

    public abstract createGeometry(): THREE.Object3D;

    public get id(): string {
        return this._id;
    }

    public get latLon(): ILatLon {
        return this._latLon;
    }
}

export default Marker;
