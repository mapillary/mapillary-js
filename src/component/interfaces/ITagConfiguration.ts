import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of tag component.
 *
 * @interface
 */
export interface ITagConfiguration extends IComponentConfiguration {
    /**
     * Value indicating the color of vertices and edges for tags that
     * are being created.
     *
     * @default 0xFFFFFF
     */
    createColor?: number;

    /**
     * String literal determining the geometry type the component
     * will create in create mode.
     *
     * @description Possible values are 'point', 'polygon' and 'rect'.
     */
    createType?: "point" | "polygon" | "rect";

    /**
     * Value indicating whether the component is in create mode.
     *
     * @default false
     */
    creating?: boolean;
}

export default ITagConfiguration;
