import {IComponentConfiguration} from "../../Component";

export interface ISliderKeys {
    background: string;
    foreground: string;
}

export interface ISliderConfiguration extends IComponentConfiguration {
    keys?: ISliderKeys;
}

export default ISliderConfiguration;
