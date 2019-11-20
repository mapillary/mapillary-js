import {
    IComponentConfiguration,
    TagMode,
} from "../../Component";

/**
 * Interface for configuration of tag component.
 *
 * @interface
 * @example
 * ```
 * var viewer = new Mapillary.Viewer('<element-id>', '<client-id>', '<image-key>',
 *     {
 *         component: {
 *             tag: {
 *                 createColor: 0xFF0000,
 *                 mode: Mapillary.TagComponent.TagMode.CreateRect,
 *             },
 *         },
 *     })
 * ```
 */
export interface ITagConfiguration extends IComponentConfiguration {
    /**
     * The color of vertices and edges for tags that
     * are being created.
     *
     * @default 0xFFFFFF
     */
    createColor?: number;

    /**
     * Show an indicator at the centroid of the points geometry
     * that creates the geometry when clicked.
     * @default true
     */
    indicatePointsCompleter?: boolean;

    /**
     * The interaction mode of the tag component.
     *
     * @default TagMode.Default
     */
    mode?: TagMode;
}

export default ITagConfiguration;
