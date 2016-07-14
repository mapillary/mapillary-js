declare module rbush {
    interface RBushItem {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    }

    interface RBush<T> {
        insert(item: T): void;
        load(items: T[]): void;
        remove(item: T): void;
        search(item: RBushItem): T[];
        all(): T[];
        clear(): void;
    }
}

declare function rbush<T>(
    maxTreeNodeEntries: number,
    accessorStrings?: [string, string, string, string]): rbush.RBush<T>;

export = rbush;
