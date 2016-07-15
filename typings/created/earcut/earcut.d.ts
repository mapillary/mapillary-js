declare module earcut {
    interface Data {
        vertices: number[];
        holes: number[];
        dimensions: number;
    }

    function flatten(data: number[][][]): Data;
    function deviation(vertices: number[], holes: number[], dimensions: number, triangles: number[]): number;
}

declare function earcut(vertices: number[], holes?: number[], dimensions?: number): number[];

export = earcut;
