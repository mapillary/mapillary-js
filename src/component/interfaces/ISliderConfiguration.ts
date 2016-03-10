import {IComponentConfiguration} from "../../Component";

export interface ISliderKeys {
    background: string;
    foreground: string;
}

export interface ISliderConfiguration extends IComponentConfiguration {
    initialPosition?: number;
    keys?: ISliderKeys;
    sliderVisible?: boolean;
}

export default ISliderConfiguration;
