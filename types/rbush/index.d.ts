declare interface BBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

declare class RBush<T> {
    constructor(maxEntries?: number);
    insert(item: T): RBush<T>;
    load(items: ReadonlyArray<T>): RBush<T>;
    remove(item: T, equals?: (a: T, b: T) => boolean): RBush<T>;
    clear(): RBush<T>;
    search(box: BBox): T[];
    all(): T[];
    collides(box: BBox): boolean;
    toBBox(item: T): BBox;
    compareMinX(a: T, b: T): number;
    compareMinY(a: T, b: T): number;
    toJSON(): any;
    fromJSON(data: any): RBush<T>;
}

declare module RBush {}

declare module "rbush" {
    export = RBush;
}