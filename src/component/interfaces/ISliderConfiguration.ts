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
 */
export interface ISliderConfiguration extends IComponentConfiguration {
    /**
     * Initial position of the slider on the interval [0, 1].
     */
    initialPosition?: number;

    /**
     * Slider keys.
     */
    keys?: ISliderKeys;

    /**
     * Value indicating whether the slider should be visible.
     */
    sliderVisible?: boolean;
}

export default ISliderConfiguration;
