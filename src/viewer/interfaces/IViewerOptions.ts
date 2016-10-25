import {IComponentOptions, ImageSize} from "../../Viewer";
import {RenderMode} from "../../Render";

/**
 * Interface for the options that can be provided to the viewer.
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
}

export default IViewerOptions;
