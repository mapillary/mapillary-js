import { ComponentConfiguration } from "./ComponentConfiguration";
import { ComponentSize } from "../utils/ComponentSize";

export interface ZoomConfiguration extends ComponentConfiguration {
    /**
     * The size of the ui elements.
     *
     * @default ComponentSize.Automatic
     */
    size?: ComponentSize;
}
