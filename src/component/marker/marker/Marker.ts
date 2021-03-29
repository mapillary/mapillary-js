import * as THREE from "three";
import { LngLat } from "../../../api/interfaces/LngLat";

/**
 * @class Marker
 *
 * @classdesc Represents an abstract marker class that should be extended
 * by marker implementations used in the marker component.
 */
export abstract class Marker {
    protected _id: string;
    protected _geometry: THREE.Object3D;
    protected _lngLat: LngLat;

    constructor(id: string, lngLat: LngLat) {
        this._id = id;
        this._lngLat = lngLat;
    }

    /**
     * Get id.
     * @returns {string} The id of the marker.
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Get geometry.
     *
     * @ignore
     */
    public get geometry(): THREE.Object3D {
        return this._geometry;
    }

    /**
     * Get lngLat.
     * @returns {LngLat} The geographic coordinates of the marker.
     */
    public get lngLat(): LngLat {
        return this._lngLat;
    }

    /** @ignore */
    public createGeometry(position: number[]): void {
        if (!!this._geometry) {
            return;
        }

        this._createGeometry(position);

        // update matrix world if raycasting occurs before first render
        this._geometry.updateMatrixWorld(true);
    }

    /** @ignore */
    public disposeGeometry(): void {
        if (!this._geometry) {
            return;
        }

        this._disposeGeometry();

        this._geometry = undefined;
    }

    /** @ignore */
    public getInteractiveObjects(): THREE.Object3D[] {
        if (!this._geometry) {
            return [];
        }

        return this._getInteractiveObjects();
    }

    /** @ignore */
    public lerpAltitude(alt: number, alpha: number): void {
        if (!this._geometry) {
            return;
        }

        this._geometry.position.z =
            (1 - alpha) * this._geometry.position.z + alpha * alt;
    }

    /** @ignore */
    public updatePosition(position: number[], lngLat?: LngLat): void {
        if (!!lngLat) {
            this._lngLat.lat = lngLat.lat;
            this._lngLat.lng = lngLat.lng;
        }

        if (!this._geometry) {
            return;
        }

        this._geometry.position.fromArray(position);
        this._geometry.updateMatrixWorld(true);
    }

    protected abstract _createGeometry(position: number[]): void;

    protected abstract _disposeGeometry(): void;

    protected abstract _getInteractiveObjects(): THREE.Object3D[];
}
