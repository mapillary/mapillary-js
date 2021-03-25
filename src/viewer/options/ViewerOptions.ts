import { ComponentOptions } from "./ComponentOptions";
import { UrlOptions } from "./UrlOptions";

import { DataProviderBase } from "../../api/DataProviderBase";
import { RenderMode } from "../../render/RenderMode";
import { TransitionMode } from "../../state/TransitionMode";

/**
 * Interface for the options that can be provided to the {@link Viewer}.
 *
 * @interface
 */
export interface ViewerOptions {
    /**
     * A data provider class instance for API and static
     * resource requests or a `Mapillary API ClientID`
     * client token string. A client id be obtained from
     * https://www.mapillary.com/app/settings/developers.
     *
     * @description A data provider instance must extend
     * the data provider base class.
     */
    apiClient: string | DataProviderBase;

    /**
     * Value specifying if combined panning should be enabled.
     * @default true
     */
    combinedPanning?: boolean;

    /**
     * Component options.
     */
    component?: ComponentOptions;

    /**
     * The HTML element in which
     * MapillaryJS will render the viewer, or the element's string `id`. The
     * specified element must have no children.
     */
    container: string | HTMLElement;

    /**
     * Optional `image-id` to start from. The id
     * can be any Mapillary image. If a id is provided the viewer is
     * bound to that id until it has been fully loaded. If null is provided
     * no image is loaded at viewer initialization and the viewer is not
     * bound to any particular id. Any image can then be navigated to
     * with e.g. `viewer.moveToId("<my-image-id>")`.
     */
    imageId?: string;

    /**
     * Value indicating if the viewer should fetch high resolution
     * image tiles.
     *
     * @description Can be used when extending `mapillary-js` with
     * a custom data provider. If no image tiling server exists
     * the image tiling can be inactivated to avoid error
     * messages about non-existing tiles in the console.
     *
     * @default true
     */
    imageTiling?: boolean

    /**
     * The render mode in the viewer.
     * @default {RenderMode.Fill}
     */
    renderMode?: RenderMode;

    /**
     * A base URL for retrieving a png sprite image and json metadata file.
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
     * @default {TransitionMode.Default}
     */
    transitionMode?: TransitionMode;

    /**
     * The URL options.
     */
    url?: UrlOptions;

    /**
     * Optional user bearer token for API requests of
     * protected resources.
     */
    userToken?: string;
}
