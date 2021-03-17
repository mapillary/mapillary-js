import { ComponentConfiguration } from "./ComponentConfiguration";

export enum CoverState {
    Hidden,
    Loading,
    Visible,
}

export interface CoverConfiguration extends ComponentConfiguration {
    id?: string;
    src?: string;
    state?: CoverState;
}
