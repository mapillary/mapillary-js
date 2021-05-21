import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { IViewer } from "./IViewer";

/**
 * @interface
 *
 * @description Interface for custom camera controls.
 * This is a specification for implementers to model:
 * it is not an exported method or class.
 *
 * Custom camera controls allow the API user to freely
 * move the viewer's camera and define the camera
 * projection used. These camera properties are used
 * to render the viewer 3D scene directly into the
 * viewer's GL context.
 *
 * Custom camera controls must implement the
 * onActivate, onAnimationFrame, onAttach, onDeactivate,
 * onDetach, onReference, and onResize methods.
 *
 * Custom camera controls trigger rerendering
 * automatically when the camera pose or projection
 * is changed through the projectionMatrix and
 * viewMatrix callbacks.
 *
 * See the
 * [model view projection article]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection}
 * on MDN for an introduction to view and projection matrices.
 *
 * Custom camera controls can choose to make updates on
 * each animation frame or only based on user input.
 * Invoking updates on each camera frame is more resource
 * intensive.
 *
 * Only a single custom camera control instance can be
 * attached to the viewer at any given time.
 */
export interface ICustomCameraControls {
    /**
     * Method called when the camera controls have been
     * activated and is responsible for moving the
     * viewer's camera and defining its projection. This
     * method gives the camera controls a chance to initialize
     * resources, perform any transitions, and determine
     * initial state.
     *
     * @description Use the {@link Viewer.getContainer} method
     * to get the container for determining the viewer size
     * and aspect as well as for attaching event handlers.
     *
     * Use the view matrix to determine initial properties such
     * as camera position, forward vector, and up vector.
     *
     * Use the projection matrix to determine the initial
     * projection properties.
     *
     * Store the reference coordiante translations
     * during future reference reference changes.
     *
     * @param {IViewer} viewer - The viewer this custom
     * camera controls instance was just added to.
     * @param {Array<number>} viewMatrix - The viewer's view matrix.
     * @param {Array<number>} projectionMatrix - The viewers's
     * projection matrix.
     * @param {LngLatAlt} reference - The viewer's reference.
     */
    onActivate(
        viewer: IViewer,
        viewMatrix: number[],
        projectionMatrix: number[],
        reference: LngLatAlt): void;

    /**
     * Method called for each animation frame.
     *
     * @desdcription Custom camera controls can choose to
     * make updates on each animation frame or only based on
     * user input. Invoking updates on each animation frame is
     * more resource intensive.
     *
     * @param {IViewer} viewer - The viewer this custom
     * camera controls instance is attached to.
     *
     * @param {number} frameId - The request animation frame's id.
     */
    onAnimationFrame(
        viewer: IViewer,
        frameId: number): void;

    /**
     * Method called when the camera controls have been
     * attached to the viewer.
     * This gives the camera controls a chance to initialize
     * resources.
     *
     * @description Camera controls are attached to the
     * viewer with the  with {@link Viewer.attachCustomCameraControls}
     * method.
     *
     * Use the matrix callback functions
     * to modify the camera pose and projection of the
     * viewer's camera.
     *
     * Invoking the matrix callbacks has no effect if the
     * custom camera controls have not been activated.
     *
     * @param {IViewer} viewer - The viewer this custom
     * camera controls instance was just added to.
     */
    onAttach(
        viewer: IViewer,
        viewMatrixCallback: (viewMatrix: number[]) => void,
        projectionMatrixCallback: (projectionMatrix: number[]) => void,
    ): void;

    /**
     * Method called when the camera controls have been deactivated.
     * This gives the camera controls a chance to clean up resources
     * and event listeners.
     *
     * @param {IViewer} viewer - The viewer this custom camera controls
     * instance is attached to.
     */
    onDeactivate(viewer: IViewer): void;

    /**
     * Method called when the camera controls have been detached from
     * the viewer. This gives the camera controls a chance to clean
     * up resources and event listeners.
     *
     * @description Camera controls are attached to the
     * viewer with the  with {@link Viewer.detachCustomCameraControls}
     * method.
     *
     * @param {IViewer} viewer - The viewer this custom camera
     * controls instance was just detached from.
     */
    onDetach(viewer: IViewer): void;

    /**
     * Method called when the viewer's reference position has changed.
     * This gives the custom camera controls a chance to reposition
     * the camera.
     *
     * @description Calculate the updated topocentric positions
     * for scene objects using the previous reference, the
     * new provided reference as well as the
     * {@link geodeticToEnu} and
     * {@link enuToGeodetic} functions.
     *
     * @param {IViewer} viewer - The viewer this custom renderer
     * is added to.
     * @param {LngLatAlt} reference - The viewer's current
     * reference position.
     */
    onReference(
        viewer: IViewer,
        reference: LngLatAlt): void;

    /**
     * Method called when the viewer has been resized.
     *
     * @description Use this method to modify the projection.
     */
    onResize(viewer: IViewer): void;
}
