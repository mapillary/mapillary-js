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

    public getDraggableObjectIds(): string[] {
        if (!this._geometry) {
            return [];
        }

        return this._getDraggableObjectIds();
    }

    public lerpAltitude(alt: number, alpha: number): void {
        if (!this._geometry) {
            return;
        }

        this._geometry.position.z = (1 - alpha) * this._geometry.position.z + alpha * alt;
    }

    public updatePosition(position: number[], latLon?: ILatLon): void {
        if (!!latLon) {
            this._latLon = latLon;
        }

        if (!this._geometry) {
            return;
        }

        this._geometry.position.fromArray(position);
    }

    protected abstract _createGeometry(position: number[]): void;

    protected abstract _disposeGeometry(): void;

    protected abstract _getDraggableObjectIds(): string[];
}

export default Marker;
