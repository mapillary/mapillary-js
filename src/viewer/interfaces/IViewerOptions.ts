interface IViewerOptionsStepThr {
    maxDistance?: number;
    distancePerf?: number;
    maxView?: number;
    maxDrift?: number;
}

export interface IViewerOptions {
    /**
     * Initial Mapillary image key to start viewer from
     * @member Mapillary.IViewerOptions#key
     * @type {string}
     */
    key?: string;

    /**
     * CoverUI to use, if not set default coverUI will be used
     * @member Mapillary.IViewerOptions#coverUI
     * @type {string[]}
     */
    coverUI?: string;

    /**
     * Type of ui to use
     * @member Mapillary.IViewerOptions#ui
     * @type {string[]}
     */
    uis?: string[];

    /**
     * Default size of the thumbnail used in the viewer
     * @member Mapillary.IViewerOptions#baseImageSize
     * @type {number}
     */
    baseImageSize?: number;
}

export default IViewerOptions;
