import { BBox } from "rbush";
import RBush from "rbush";

import { LatLon } from "../api/interfaces/LatLon";

export class GeoRBush<T extends LatLon> extends RBush<T> {
    public compareMinX(a: T, b: T): number { return a.lat - b.lat; }

    public compareMinY(a: T, b: T): number { return a.lon - b.lon; }

    public toBBox(item: T): BBox {
        return { minX: item.lat, minY: item.lon, maxX: item.lat, maxY: item.lon };
    }
}
