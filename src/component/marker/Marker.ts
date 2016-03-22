import {IMarkerOptions} from "../../Component";
import {ILatLonAlt} from "../../Graph";

export abstract class Marker {
    public visibleInKeys: string[] = [];

    private _id: string;
    private _type: string;
    private _latLonAlt: ILatLonAlt;
    private _markerOptions: IMarkerOptions;

    constructor(latLonAlt: ILatLonAlt, markerOptions: IMarkerOptions) {
        this._id = markerOptions.id;
        this._latLonAlt = latLonAlt;
        this._markerOptions = markerOptions;
        this._type = markerOptions.type;
    }

    public abstract createGeometry(): THREE.Object3D;

    public get id(): string {
        return this._id;
    }

    public get type(): string {
        return this._type;
    }

    public get latLonAlt(): ILatLonAlt {
        return this._latLonAlt;
    }
}

export default Marker;
