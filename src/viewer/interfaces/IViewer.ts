import { LngLat } from "../../api/interfaces/LngLat";
import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { Component } from "../../component/Component";
import { ComponentConfiguration }
    from "../../component/interfaces/ComponentConfiguration";
import { IDataProvider } from "../../external/api";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { FilterExpression } from "../../graph/FilterExpression";
import { Image } from "../../graph/Image";
import { RenderMode } from "../../render/RenderMode";
import { TransitionMode } from "../../state/TransitionMode";
import { CameraControls } from "../enums/CameraControls";
import { ViewerEventType } from "../events/ViewerEventType";
import { ICustomCameraControls } from "./ICustomCameraControls";

import { ICustomRenderer } from "./ICustomRenderer";
import { PointOfView } from "./PointOfView";

export interface IViewer {
    readonly dataProvider: IDataProvider;
    readonly isNavigable: boolean;
    activateCombinedPanning(): void;
    activateComponent(name: string): void;
    activateCover(): void;
    addCustomRenderer(renderer: ICustomRenderer): void;
    attachCustomCameraControls(controls: ICustomCameraControls): void;
    deactivateCombinedPanning(): void;
    deactivateComponent(name: string): void;
    deactivateCover(): void;
    detachCustomCameraControls(): Promise<ICustomCameraControls>;
    fire<T>(
        type: ViewerEventType,
        event: T): void;
    getBearing(): Promise<number>;
    getCameraControls(): Promise<CameraControls>;
    getCanvas(): HTMLCanvasElement;
    getCanvasContainer(): HTMLDivElement;
    getCenter(): Promise<number[]>;
    getComponent<TComponent extends Component<ComponentConfiguration>>(
        name: string): TComponent;
    getContainer(): HTMLElement;
    getFieldOfView(): Promise<number>;
    getImage(): Promise<Image>;
    getPointOfView(): Promise<PointOfView>;
    getPosition(): Promise<LngLat>;
    getReference(): Promise<LngLatAlt>;
    getZoom(): Promise<number>;
    hasCustomCameraControls(controls: ICustomCameraControls): boolean;
    hasCustomRenderer(rendererId: string): boolean;
    moveDir(direction: NavigationDirection): Promise<Image>;
    moveTo(imageId: string): Promise<Image>;
    off<T>(
        type: ViewerEventType,
        handler: (event: T) => void): void;
    on<T>(
        type: ViewerEventType,
        handler: (event: T) => void): void;
    project(lngLat: LngLat): Promise<number[]>;
    projectFromBasic(basicPoint: number[]): Promise<number[]>;
    remove(): void;
    removeCustomRenderer(rendererId: string): void;
    resize(): void;
    setCameraControls(controls: CameraControls): void;
    setCenter(center: number[]): void;
    setFieldOfView(fov: number): void;
    setFilter(filter?: FilterExpression): Promise<void>;
    setRenderMode(renderMode: RenderMode): void;
    setTransitionMode(transitionMode: TransitionMode): void;
    setAccessToken(accessToken?: string): Promise<void>;
    setZoom(zoom: number): void;
    triggerRerender(): void;
    unproject(pixelPoint: number[]): Promise<LngLat>;
    unprojectToBasic(pixelPoint: number[]): Promise<number[]>;
}
