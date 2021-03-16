import { ComponentConfiguration } from "./ComponentConfiguration";
import { ComponentSize } from "../utils/ComponentSize";

export interface BearingConfiguration extends ComponentConfiguration {
    /**
     * The size of the ui elements.
     *
     * @default ComponentSize.Automatic
     */
    size?: ComponentSize;
}
