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
     * @type {Node}
     */
    key?: string;

    /**
     * Type of ui to use
     * @member Mapillary.IViewerOptions#ui
     * @type {Node}
     */
    uis?: string[];

    uiList?: string[];

    stepThr?: IViewerOptionsStepThr;
    enablePanoNavigation?: boolean;
    enablePanoPlaying?: boolean;
    enablePanoArrowAlignment?: boolean;
    gamingNavigation?: boolean;
}

export default IViewerOptions;
