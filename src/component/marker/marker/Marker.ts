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

    public createGeometry(position: number[]): void {
        if (!!this._geometry) {
            return;
        }

        this._createGeometry(position);
    }

    public disposeGeometry(): void {
        if (!this._geometry) {
            return;
        }

        this._disposeGeometry();

        this._geometry = null;
    }

    public updatePosition(position: number[]): void {
        if (!this._geometry) {
            return;
        }

        this._updatePosition(position);
    }

    protected abstract _createGeometry(position: number[]): void;

    protected abstract _disposeGeometry(): void;

    protected abstract _updatePosition(position: number[]): void;
}

export default Marker;
