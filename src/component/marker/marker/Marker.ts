import {ILatLon} from "../../../API";

export abstract class Marker {
    protected _id: string;
    protected _geometry: THREE.Object3D;
    protected _latLon: ILatLon;

    constructor(id: string, latLon: ILatLon) {
        this._id = id;
        this._latLon = latLon;
    }

    public get id(): string {
        return this._id;
    }

    public get geometry(): THREE.Object3D {
        return this._geometry;
    }

    public get latLon(): ILatLon {
        return this._latLon;
    }

    public abstract createGeometry(position: number[]): void;

    public abstract disposeGeometry(): void;

    public abstract updatePosition(position: number[]): void;
}

export default Marker;
