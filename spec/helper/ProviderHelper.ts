import { DataProviderBase } from "../../src/api/DataProviderBase";
import { GeometryProviderBase } from "../../src/api/GeometryProviderBase";

export class GeometryProvider extends GeometryProviderBase { }

export class DataProvider extends DataProviderBase {
    constructor() { super(new GeometryProvider()); }
}
