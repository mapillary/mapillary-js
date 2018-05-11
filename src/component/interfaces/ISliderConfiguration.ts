import {IComponentConfiguration} from "../../Component";

/**
 * Enumeration for slider mode.
 *
 * @enum {number}
 * @readonly
 *
 * @description Modes for specifying how transitions
 * between nodes are performed in slider mode. Only
 * applicable when the slider component determines
 * that transitions with motion is possilble. When it
 * is not, the stationary mode will be applied.
 */
export enum SliderMode {
    /**
     * Transitions with motion.
     *
     * @description The slider component moves the
     * camera between the node origins.
     *
     * In this mode it is not possible to zoom or pan.
     *
     * The slider component falls back to stationary
     * mode when it determines that the pair of nodes
     * does not have a strong enough relation.
     */
    Motion,

    /**
     * Stationary transitions.
     *
     * @description The camera is stationary.
     *
     * In this mode it is possible to zoom and pan.
     */
    Stationary,
}

/**
 * Interface for configuration of slider keys.
 *
 * @interface
 */
export interface ISliderKeys {
    /**
     * Key for the image plane in the background.
     */
    background: string;

    /**
     * Key for the image plane in the foreground.
     */
    foreground: string;
}

/**
 * Interface for configuration of slider component.
 *
 * @interface
 * ```
 * var viewer = new Mapillary.Viewer('<element-id>', '<client-id>', '<image-key>',
 *     {
 *         component: {
 *             slider: {
 *                 initialPosition: 0.5,
 *                 keys: {
 *                     background: '<background-key>',
 *                     foreground: '<foreground-key>',
 *                 },
 *                 sliderVisible: true,
 *             },
 *         },
 *     })
 * ```
 */
export interface ISliderConfiguration extends IComponentConfiguration {
    /**
     * Initial position of the slider on the interval [0, 1].
     *
     * @default 1
     */
    initialPosition?: number;

    /**
     * Slider keys.
     */
    keys?: ISliderKeys;

    /**
     * Value indicating whether the slider should be visible.
     *
     * @default true
     */
    sliderVisible?: boolean;

    /**
     * Mode used for image pair transitions.
     */
    mode?: SliderMode;
}

export default ISliderConfiguration;
