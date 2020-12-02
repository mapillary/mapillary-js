import DataProviderBase from "../../api/DataProviderBase";
import RenderMode from "../../render/RenderMode";
import TransitionMode from "../../state/TransitionMode";
import ImageSize from "../ImageSize";
import IComponentOptions from "./IComponentOptions";
import IUrlOptions from "./IUrlOptions";

/**
 * Interface for the options that can be provided to the {@link Viewer}.
 *
 * @interface
 */
export interface IViewerOptions {
    /**
     * A data provider class instance for API and static
     * resource requests or a `Mapillary API ClientID`
     * client token string. A client id be obtained from
     * https://www.mapillary.com/app/settings/developers.
     */
    apiClient: string | DataProviderBase;

    /**
     * Default size of the thumbnail used in the viewer
     * @default {ImageSize.Size640}
     */
    baseImageSize?: ImageSize;

    /**
     * Default size of the thumbnail used for panoramas in the viewer
     * @default {ImageSize.Size2048}
     */
    basePanoramaSize?: ImageSize;

    /**
     * Value specifying if combined panning should be enabled.
     * @default true
     */
    combinedPanning?: boolean;

    /**
     * Component options.
     */
    component?: IComponentOptions;

    /**
     * The HTML element in which
     * MapillaryJS will render the viewer, or the element's string `id`. The
     * specified element must have no children.
     */
    container: string | HTMLElement;

    /**
     * Optional `image-key` to start from. The key
     * can be any Mapillary image. If a key is provided the viewer is
     * bound to that key until it has been fully loaded. If null is provided
     * no image is loaded at viewer initialization and the viewer is not
     * bound to any particular key. Any image can then be navigated to
     * with e.g. `viewer.moveToKey("<my-image-key>")`.
     */
    imageKey?: string;

    /**
     * The max size of an image shown in the viewer
     * will be used when user pauses.
     * @default {ImageSize.Size2048}
     */
    maxImageSize?: ImageSize;

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
     * Optional user bearer token for API requests of
     * protected resources.
     */
    userToken?: string;

    /**
     * The transtion mode in the viewer.
     * @default {TransitionMode.Default}
     */
    transitionMode?: TransitionMode;

    /**
     * The URL options.
     */
    url?: IUrlOptions;
}

export default IViewerOptions;
