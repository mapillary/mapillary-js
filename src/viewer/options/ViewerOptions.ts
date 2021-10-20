import { ComponentOptions } from "./ComponentOptions";
import { UrlOptions } from "./UrlOptions";

import { IDataProvider } from "../../api/interfaces/IDataProvider";
import { RenderMode } from "../../render/RenderMode";
import { TransitionMode } from "../../state/TransitionMode";
import { CameraControls } from "../enums/CameraControls";

/**
 * Interface for the options that can be provided to the {@link Viewer}.
 */
export interface ViewerOptions {
    /**
     * Optional access token for API requests of
     * resources.
     *
     * @description Can be a user access token or
     * a client access token.
     *
     * A Mapillary client access token can be obtained
     * by [signing in](https://www.mapillary.com/app/?login=true) and
     * [registering an application](https://www.mapillary.com/dashboard/developers).
     *
     * The access token can also be set through the
     * {@link Viewer.setAccessToken} method.
     */
    accessToken?: string;

    /**
     * Value specifying the initial camera controls of
     * the viewer.
     *
     * @default {@link CameraControls.Street}
     */
    cameraControls?: CameraControls;

    /**
     * Value specifying if combined panning should be activated.
     *
     * @default true
     */
    combinedPanning?: boolean;

    /**
     * Component options.
     */
    component?: ComponentOptions;

    /**
     * The HTML element in which MapillaryJS will render the
     * viewer, or the element's string `id`. The
     * specified element must have no children.
     */
    container: string | HTMLElement;

    /**
     * Optional data provider class instance for API and static
     * resource requests.
     *
     * @description The data provider will override the
     * default MapillaryJS data provider and take responsibility
     * for all IO handling.
     *
     * The data provider takes precedence over the {@link ViewerOptions.accessToken} property.
     *
     * A data provider instance must implement all members
     * specified in the {@link IDataProvider} interface. This can
     * be done by extending the {@link DataProviderBase} class or
     * implementing the interface directly.
     */
    dataProvider?: IDataProvider;

    /**
     * Optional `image-id` to start from. The id
     * can be any Mapillary image. If a id is provided the viewer is
     * bound to that id until it has been fully loaded. If null is provided
     * no image is loaded at viewer initialization and the viewer is not
     * bound to any particular id. Any image can then be navigated to
     * with e.g. `viewer.moveTo("<my-image-id>")`.
     */
    imageId?: string;

    /**
     * Value indicating if the viewer should fetch high resolution
     * image tiles.
     *
     * @description Can be used when extending MapillaryJS with
     * a custom data provider. If no image tiling server exists
     * the image tiling can be inactivated to avoid error
     * messages about non-existing tiles in the console.
     *
     * @default true
     */
    imageTiling?: boolean;

    /**
     * The render mode in the viewer.
     *
     * @default {@link RenderMode.Fill}
     */
    renderMode?: RenderMode;

    /**
     * A base URL for retrieving a PNG sprite image and json metadata file.
     * File name extensions will be automatically appended.
     */
    sprite?: string;

    /**
     * If `true`, the viewer will automatically resize when the
     * browser window resizes.
     *
     * @default true
     */
    trackResize?: boolean;

    /**
     * The transtion mode in the viewer.
     *
     * @default {@link TransitionMode.Default}
     */
    transitionMode?: TransitionMode;

    /**
     * The URL options.
     */
    url?: UrlOptions;
}
