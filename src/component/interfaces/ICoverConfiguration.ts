import { IComponentConfiguration } from "./IComponentConfiguration";

export enum CoverState {
    Hidden,
    Loading,
    Visible,
}

export interface ICoverConfiguration extends IComponentConfiguration {
    key?: string;
    src?: string;
    state?: CoverState;
}
