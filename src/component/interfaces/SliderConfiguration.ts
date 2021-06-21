import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Enumeration for slider mode.
 *
 * @enum {number}
 * @readonly
 *
 * @description Modes for specifying how transitions
 * between images are performed in slider mode. Only
 * applicable when the slider component determines
 * that transitions with motion is possilble. When it
 * is not, the stationary mode will be applied.
 */
export enum SliderConfigurationMode {
    /**
     * Transitions with motion.
     *
     * @description The slider component moves the
     * camera between the image origins.
     *
     * In this mode it is not possible to zoom or pan.
     *
     * The slider component falls back to stationary
     * mode when it determines that the pair of images
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
 * Interface for configuration of slider ids.
 *
 * @interface
 */
export interface SliderConfigurationIds {
    /**
     * Id for the image plane in the background.
     */
    background: string;

    /**
     * Id for the image plane in the foreground.
     */
    foreground: string;
}

/**
 * Interface for configuration of slider component.
 *
 * @interface
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         slider: {
 *             initialPosition: 0.5,
 *             ids: {
 *                 background: '<background-id>',
 *                 foreground: '<foreground-id>',
 *             },
 *             sliderVisible: true,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface SliderConfiguration extends ComponentConfiguration {
    /**
     * Initial position of the slider on the interval [0, 1].
     *
     * @description Configures the initial position of the slider.
     * The inital position value will be used when the component
     * is activated.
     *
     * @default 1
     */
    initialPosition?: number;

    /**
     * Slider image ids.
     *
     * @description Configures the component to show the image
     * planes for the supplied image ids  in the foreground
     * and the background.
     */
    ids?: SliderConfigurationIds;

    /**
     * Value indicating whether the slider should be visible.
     *
     * @description Set the value controlling if the
     * slider is visible.
     *
     * @default true
     */
    sliderVisible?: boolean;

    /**
     * Mode used for image pair transitions.
     *
     * @description Configures the mode for transitions between
     * image pairs.
     */
    mode?: SliderConfigurationMode;
}
