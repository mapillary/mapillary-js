interface IViewerOptionsStepThr {
    maxDistance?: number;
    distancePerf?: number;
    maxView?: number;
    maxDrift?: number;
}

export interface IViewerOptions {
    /**
     * Start viewer in active state
     * @member Mapillary.IViewerOptions#active
     * @type {Node}
     */
    active?: boolean;

    /**
     * Initial Mapillary image key to start viewer from
     * @member Mapillary.IViewerOptions#key
     * @type {Node}
     */
    key?: string;

    stepThr?: IViewerOptionsStepThr;
    enablePanoNavigation?: boolean;
    enablePanoPlaying?: boolean;
    enablePanoArrowAlignment?: boolean;
    gamingNavigation?: boolean;
}

export default IViewerOptions;
