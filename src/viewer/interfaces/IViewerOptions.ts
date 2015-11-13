interface IViewerOptionsStepThr {
    maxDistance?: number;
    distancePerf?: number;
    maxView?: number;
    maxDrift?: number;
}

export interface IViewerOptions {
    debugLevel?: string;

    stepThr?: IViewerOptionsStepThr;

    enablePanoNavigation?: boolean;
    enablePanoPlaying?: boolean;
    enablePanoArrowAlignment?: boolean;
    gamingNavigation?: boolean;

    initialNode?: string;
}

export default IViewerOptions;
