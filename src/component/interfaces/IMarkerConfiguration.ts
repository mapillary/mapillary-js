import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of marker component.
 *
 * @interface
 * @example
 * ```
 * var viewer = new Mapillary.Viewer('<element-id>', '<client-id>', '<image-key>',
 *     {
 *         component: {
 *             marker: {
 *                 visibleBBoxSize: 80,
 *             },
 *         },
 *     })
 * ```
 */
export interface IMarkerConfiguration extends IComponentConfiguration {
    /**
     * The size of the bounding box for which markers will be visible.
     *
     * @description Provided values will be clamped to the [1, 200]
     * interval.
     *
     * @default 100
     */
    visibleBBoxSize?: number;
}

export default IMarkerConfiguration;
