interface IViewerOptionsStepThr {
    maxDistance?: number;
    distancePerf?: number;
    maxView?: number;
    maxDrift?: number;
}

export interface IViewerOptions {
    /**
     * Use a cover and avoid loading initial data from Mapillary.
     * @member Mapillary.IViewerOptions#useCover
     * @type {boolean}
     */
    cover?: boolean;

    /**
     * Show debug interface
     * @member Mapillary.IViewerOptions#debug
     * @type {boolean}
     */
    debug?: boolean;

    /**
     * Default size of the thumbnail used in the viewer
     * @member Mapillary.IViewerOptions#baseImageSize
     * @type {number}
     */
    baseImageSize?: number;

    /**
     * The max size of an image shown in the viewer
     * will be used when user pauses.
     * @member Mapillary.IViewerOptions#maxImageSize
     * @type {number}
     */
    maxImageSize?: number;

}

export default IViewerOptions;
