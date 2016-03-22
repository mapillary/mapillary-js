declare class Pbf {
    constructor(buffer: Buffer);
}

declare module Pbf {
}

declare module "pbf" {
    export = Pbf;
}
