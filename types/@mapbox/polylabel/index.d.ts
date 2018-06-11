declare function polylabel(polygon: number[][][], precision?: number, debug?: boolean): number[];

declare module polylabel { }

declare module "@mapbox/polylabel" {
    export = polylabel;
}
