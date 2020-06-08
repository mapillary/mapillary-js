import * as RBush from "rbush";

import { ILatLon } from "../API";

export class GeoRBush<T extends ILatLon> extends RBush<T> {
    public compareMinX(a: T, b: T): number { return a.lat - b.lat; }

    public compareMinY(a: T, b: T): number { return a.lon - b.lon; }

    public toBBox(item: T): BBox {
        return { minX: item.lat, minY: item.lon, maxX: item.lat, maxY: item.lon };
    }
}

export default GeoRBush;
