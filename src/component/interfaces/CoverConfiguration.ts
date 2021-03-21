import { CoverState } from "../cover/CoverState";
import { ComponentConfiguration } from "./ComponentConfiguration";

export interface CoverConfiguration extends ComponentConfiguration {
    id?: string;
    src?: string;
    state?: CoverState;
}
