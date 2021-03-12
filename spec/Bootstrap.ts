import { ComponentService } from "../src/component/ComponentService";
import { MarkerSet } from "../src/component/marker/MarkerSet";
import { Graph } from "../src/graph/Graph";
import { TraversingState } from "../src/state/states/TraversingState";
import { IInterpolator } from "../src/utils/interfaces/IInterpolator";

type Item = {
    lat: number;
    lon: number;
};

type BBox = {
    maxX: number,
    maxY: number,
    minX: number,
    minY: number,
}

class SpatialIndexMock<T extends Item> {
    private _items: T[] = []
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
                    return item.lat > bbox.minX &&
                        item.lat < bbox.maxX &&
                        item.lon > bbox.minY &&
                        item.lon < bbox.maxY;
                });
    }
}

class CoverMock { public activate(): void { /* noop */ } }

class InterpolatorMock implements IInterpolator {
    public solve(x: number): number { return x; }
}

export function bootstrap(): void {
    ComponentService.registerCover(<any>CoverMock);
    Graph.register(SpatialIndexMock);
    MarkerSet.register(SpatialIndexMock);
    TraversingState.register(InterpolatorMock);
}
