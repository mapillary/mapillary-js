import {Alignment} from "../../../Viewer";
import {TagDomain} from "../../../Component";

/**
 * Interface for the options that define the behavior and
 * appearance of the outline tag.
 *
 * @interface
 */
export interface IOutlineTagOptions {
    /**
     * The domain where lines between vertices are treated as straight.
     *
     * @description Only applicable for tags that renders polygons.
     *
     * If the domain is specified as two dimensional, editing of the
     * polygon will be disabled.
     *
     * @default {TagDomain.TwoDimensional}
     */
    domain?: TagDomain;

    /**
     * Indicate whether the tag geometry should be editable.
     *
     * @description Polygon tags with two dimensional domain
     * are never editable.
     *
     * @default false
     */
    editable?: boolean;

    /**
     * Color for the interior fill as a hexadecimal number.
     * @default 0xFFFFFF
     */
    fillColor?: number;

    /**
     * Opacity of the interior fill between 0 and 1.
     * @default 0.3
     */
    fillOpacity?: number;

    /**
     * A string referencing the sprite data property to pull from.
     *
     * @description Icon is not shown for tags with polygon
     * geometries in panoramas.
     */
    icon?: string;

    /**
     * Value determining how the icon will float with respect to its anchor
     * position when rendering.
     *
     * @default {Alignment.Center}
     */
    iconFloat?: Alignment;

    /**
     * Number representing the index for where to show the icon or
     * text for a rectangle geometry.
     *
     * @description The default index corresponds to the bottom right corner.
     *
     * @default 3
     */
    iconIndex?: number;

    /**
     * Determines whether vertices should be indicated by points
     * when tag is editable.
     *
     * @default true
     */
    indicateVertices?: boolean;

    /**
     * Color for the edge lines as a hexadecimal number.
     * @default 0xFFFFFF
     */
    lineColor?: number;

    /**
     * Opacity of the edge lines on [0, 1].
     * @default 1
     */
    lineOpacity?: number;

    /**
     * Line width in pixels.
     * @default 1
     */
    lineWidth?: number;

    /**
     * Text shown as label if no icon is provided.
     *
     * @description Text is not shown for tags with
     * polygon geometries in panoramas.
     */
    text?: string;

    /**
     * Text color as hexadecimal number.
     * @default 0xFFFFFF
     */
    textColor?: number;
}

export default IOutlineTagOptions;
