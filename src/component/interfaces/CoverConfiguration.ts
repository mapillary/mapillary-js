import { ComponentConfiguration } from "./ComponentConfiguration";

export enum CoverState {
    Hidden,
    Loading,
    Visible,
}

export interface CoverConfiguration extends ComponentConfiguration {
    key?: string;
    src?: string;
    state?: CoverState;
}
