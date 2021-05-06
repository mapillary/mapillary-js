import { ComponentConfiguration } from "./ComponentConfiguration";
import { TagMode } from "../tag/TagMode";

/**
 * Interface for configuration of tag component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         tag: {
 *             createColor: 0xFF0000,
 *             mode: TagMode.CreateRect,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface TagConfiguration extends ComponentConfiguration {
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
