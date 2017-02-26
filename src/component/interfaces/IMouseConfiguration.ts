import {IComponentConfiguration} from "../../Component";

export interface IMouseConfiguration extends IComponentConfiguration {
    dragPan?: boolean;
    scrollZoom?: boolean;
    touchZoom?: boolean;
}

export default IMouseConfiguration;
