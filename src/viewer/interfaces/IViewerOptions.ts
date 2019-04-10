import {IComponentOptions, ImageSize, IUrlOptions} from "../../Viewer";
import {RenderMode} from "../../Render";
import {TransitionMode} from "../../State";

/**
 * Interface for the options that can be provided to the {@link Viewer}.
 *
 * @interface
 */
export interface IViewerOptions {
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
     * The component options.
     */
    component?: IComponentOptions;

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
