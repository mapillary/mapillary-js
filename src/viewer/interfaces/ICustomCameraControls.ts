import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { IViewer } from "./IViewer";

export interface ICustomCameraControls {
    onActivate(
        viewer: IViewer,
        viewMatrix: number[],
        reference: LngLatAlt): void;
    onAnimationFrame(
        viewer: IViewer,
        frameId: number): void;
    onAttach(
        viewer: IViewer,
        canvas: HTMLCanvasElement,
        projectionMatrixCallback: (projectionMatrix: number[]) => void,
        viewMatrixCallback: (viewMatrix: number[]) => void,
    ): void;
    onDeactivate(viewer: IViewer): void;
    onDetach(viewer: IViewer): void;
    onReference(
        viewer: IViewer,
        reference: LngLatAlt): void;
    onResize(viewer: IViewer): void;
}
