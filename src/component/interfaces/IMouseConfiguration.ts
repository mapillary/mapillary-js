import {IComponentConfiguration} from "../../Component";

export interface IMouseConfiguration extends IComponentConfiguration {
    doubleClickZoom?: boolean;
    dragPan?: boolean;
    scrollZoom?: boolean;
    touchZoom?: boolean;
}

export default IMouseConfiguration;
