import {IComponentConfiguration} from "../../Component";

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
 * var viewer = new Mapillary.Viewer('<element-id>', '<client-id>', '<photo-key>',
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
}

export default ISliderConfiguration;
