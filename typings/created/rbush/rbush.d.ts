declare module "rbush" {
    module rbush {
        interface RBush<T> {
            insert(item: T): void;
            remove(item: T): void;
            search(bbox: [number, number, number, number]): T[];
            all(): T[];
            clear(): void;
        }
    }

    function rbush<T>(
        maxEntries: number,
        accessorStrings?: [string, string, string, string]): rbush.RBush<T>;

    export = rbush;
}