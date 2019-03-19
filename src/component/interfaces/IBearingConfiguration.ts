import { IComponentConfiguration } from "./interfaces";
import ComponentSize from "../utils/ComponentSize";

export interface IBearingConfiguration extends IComponentConfiguration {
    /**
     * The size of the ui elements.
     *
     * @default ComponentSize.Automatic
     */
    size?: ComponentSize;
}

export default IBearingConfiguration;
