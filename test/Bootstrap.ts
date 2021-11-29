import { ComponentService } from "../src/component/ComponentService";
import { MarkerSet } from "../src/component/marker/MarkerSet";
import { Graph } from "../src/graph/Graph";

type Item = {
    lat: number;
    lng: number;
};

type BBox = {
    maxX: number,
    maxY: number,
    minX: number,
    minY: number,
};

class SpatialIndexMock<T extends Item> {
    private _items: T[] = [];
    public all(): T[] { return this._items.slice(); }
    public clear(): void { this._items = []; }
    public insert(item: T): void { this._items.push(item); }
    public remove(item: T): void {
        const index = this._items.indexOf(item);
        if (index > -1) { this._items.splice(index, 1); }
    }
    public search(bbox: BBox): T[] {
        return this._items
            .filter(
                item => {
                    return item.lng > bbox.minX &&
                        item.lng < bbox.maxX &&
                        item.lat > bbox.minY &&
                        item.lat < bbox.maxY;
                });
    }
}

class CoverMock { public activate(): void { /* noop */ } }

export function bootstrap(): void {
    ComponentService.registerCover(<any>CoverMock);
    Graph.register(SpatialIndexMock);
    MarkerSet.register(SpatialIndexMock);
}
