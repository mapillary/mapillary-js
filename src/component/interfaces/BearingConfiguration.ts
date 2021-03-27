import { ComponentConfiguration } from "./ComponentConfiguration";
import { ComponentSize } from "../util/ComponentSize";

export interface BearingConfiguration extends ComponentConfiguration {
    /**
     * The size of the ui elements.
     *
     * @default ComponentSize.Automatic
     */
    size?: ComponentSize;
}
