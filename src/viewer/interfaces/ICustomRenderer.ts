import { ILatLonAlt } from "../../geo/interfaces/ILatLonAlt";
import { Viewer } from "../Viewer";

/**
 * @interface
 *
 * Interface for custom renderers. This is a specification
 * for implementers to model: it is not an exported method
 * or class.
 *
 * Custom renderer allow a user to render directly into
 * the viewer's GL context using the viewer's camera.
 *
 * Custom renderers must have a unique id. They must implement
 * render, onReferenceChanged, onAdd, and onRemove. They can
 * trigger rendering using {Viewer#triggerRerender}.
 *
 * The viewer uses a metric topocentric [local east, north, up
 * coordinate system]{@link https://en.wikipedia.org/wiki/Local_tangent_plane_coordinates}.
 *
 * Custom renderers can calculate the topocentric positions
 * of their objects using the reference parameter of the
 * renderer interface methods and the {GeoCoords#geodeticToEnu}
 * method.
 */
export interface ICustomRenderer {
    /**
     * A unique renderer id.
     */
    id: string;

    /**
     * Method called when the renderer has been added to the
     * viewer with {Viewer#addCustomRenderer}. This gives the
     * renderer a chance to initialize gl resources and
     * register event listeners.
     *
     * @description Calculate the topocentric positions
     * for scene objects using the provided reference and
     * the {GeoCoords#geodeticToEnu} method.
     *
     * @param {Viewer} viewer - The viewer this custom renderer
     * was just added to.
     * @param {ILatLonAlt} reference - The viewer's current
     * reference position.
     * @param {WebGLRenderingContext | WebGL2RenderingContext} context -
     * The viewer's gl context.
     */
    onAdd(
        viewer: Viewer,
        reference: ILatLonAlt,
        context: WebGLRenderingContext | WebGL2RenderingContext): void;

    /**
     * Method called when the viewer's reference position has changed.
     * This gives the renderer a chance to reposition its scene objects.
     *
     * @description Calculate the updated topocentric positions
     * for scene objects using the provided reference and
     * the {GeoCoords#geodeticToEnu} method.
     *
     * @param {Viewer} viewer - The viewer this custom renderer
     * is added to.
     * @param {ILatLonAlt} reference - The viewer's current
     * reference position.
     */
    onReferenceChanged(
        viewer: Viewer,
        reference: ILatLonAlt): void;

    /**
     * Method called when the renderer has been removed from the
     * viewer with {Viewer#removeCustomRenderer}. This gives the
     * renderer a chance to clean up gl resources and event
     * listeners.
     *
     * @param {Viewer} viewer - The viewer this custom renderer
     * was just removed from.
     * @param {WebGLRenderingContext | WebGL2RenderingContext} context -
     * The viewer's gl context.
     */
    onRemove(
        viewer: Viewer,
        context: WebGLRenderingContext | WebGL2RenderingContext): void;

    /**
     * Called during a render frame allowing the renderer to draw
     * into the GL context. The layer cannot make assumptions
     * about the current GL state.
     *
     * @description Refer to [this MDN Web
     * Doc]{@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection}
     * for an introduction to the view and projection matrices.
     *
     * @param {WebGLRenderingContext | WebGL2RenderingContext} context -
     * The viewer's gl context.
     * @param {Array<number>} viewMatrix - The viewer's view matrix.
     * @param {Array<number>} projectionMatrix - The viewers's projection
     * matrix.
     */
    render(
        context: WebGLRenderingContext | WebGL2RenderingContext,
        viewMatrix: number[],
        projectionMatrix: number[]): void;
}
