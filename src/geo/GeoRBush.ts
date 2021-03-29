import { BBox } from "rbush";
import RBush from "rbush";

import { LngLat } from "../api/interfaces/LngLat";

export class GeoRBush<T extends LngLat> extends RBush<T> {
    public compareMinX(a: T, b: T): number {
        return a.lng - b.lng;
    }

    public compareMinY(a: T, b: T): number {
        return a.lat - b.lat;
    }

    public toBBox(item: T): BBox {
        return {
            minX: item.lng,
            minY: item.lat,
            maxX: item.lng,
            maxY: item.lat,
        };
    }
}
