import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { RenderPass } from "../enums/RenderPass";
import { IViewer } from "./IViewer";

/**
 * @interface
 *
 * @description Interface for custom renderers. This is a
 * specification for implementers to model: it is not
 * an exported method or class.
 *
 * A custom renderer allows the API user to render directly
 * into the viewer's GL context using the viewer's camera.
 *
 * Custom renderers must have a unique id. They must implement
 * render, onReferenceChanged, onAdd, and onRemove. They can
 * trigger rendering using {@link Viewer.triggerRerender}.
 *
 * The viewer uses a metric topocentric
 * [local east, north, up coordinate system](https://en.wikipedia.org/wiki/Local_tangent_plane_coordinates).
 *
 * Custom renderers can calculate the topocentric positions
 * of their objects using the reference parameter of the
 * renderer interface methods and the {@link geodeticToEnu}
 * method.
 *
 * During a render pass, custom renderers
 * are called in the order they were added.
 */
export interface ICustomRenderer {
    /**
     * A unique renderer id.
     */
    id: string;

    /**
     * The custom renderer's render pass.
     *
     * @description The {@link ICustomRenderer.render} method
     * will be called during this render pass.
     */
    renderPass: RenderPass;

    /**
     * Method called when the renderer has been added to the
     * viewer. This gives the
     * renderer a chance to initialize gl resources and
     * register event listeners.
     *
     * @description Custom renderers are added with the
     * with {@link Viewer.addCustomRenderer} method.
     *
     * Calculate the topocentric positions
     * for scene objects using the provided reference and
     * the {@link geodeticToEnu} function.
     *
     * @param {IViewer} viewer - The viewer this custom renderer
     * was just added to.
     * @param {LngLatAlt} reference - The viewer's current
     * reference position.
     * @param {WebGLRenderingContext | WebGL2RenderingContext} context -
     * The viewer's gl context.
     */
    onAdd(
        viewer: IViewer,
        reference: LngLatAlt,
        context: WebGLRenderingContext | WebGL2RenderingContext): void;

    /**
     * Method called when the viewer's reference position has changed.
     * This gives the renderer a chance to reposition its scene objects.
     *
     * @description Calculate the updated topocentric positions
     * for scene objects using the provided reference and
     * the {@link geodeticToEnu} function.
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
     * Method called when the renderer has been removed from the
     * viewer. This gives the
     * renderer a chance to clean up gl resources and event
     * listeners.
     *
     * @description Custom renderers are remove with the
     * {@link Viewer.removeCustomRenderer} method.
     *
     * @param {IViewer} viewer - The viewer this custom renderer
     * was just removed from.
     * @param {WebGLRenderingContext | WebGL2RenderingContext} context -
     * The viewer's gl context.
     */
    onRemove(
        viewer: IViewer,
        context: WebGLRenderingContext | WebGL2RenderingContext): void;

    /**
     * Called during an animation frame allowing the renderer to draw
     * into the GL context. The layer cannot make assumptions
     * about the current GL state.
     *
     * @description Take a look at the
     * [WebGL model view projection article](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection)
     * on MDN for an introduction to the view and projection matrices.
     *
     * @param {WebGLRenderingContext | WebGL2RenderingContext} context The
     * viewer's WebGL context.
     * @param {Array<number>} viewMatrix The viewer's view matrix.
     * @param {Array<number>} projectionMatrix The viewers's projection
     * matrix.
     */
    render(
        context: WebGLRenderingContext | WebGL2RenderingContext,
        viewMatrix: number[],
        projectionMatrix: number[]): void;
}
