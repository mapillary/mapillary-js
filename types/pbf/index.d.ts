declare class Pbf<T> {
    constructor(buffer: Buffer);

    readFields(readData: (tag: number, data: T, pbf: Pbf<T>) => void, data: T): T;

    readVarint(): number;
    readFloat(): number;

    destroy(): void;
}

declare module Pbf { }

declare module "pbf" {
    export = Pbf;
}
