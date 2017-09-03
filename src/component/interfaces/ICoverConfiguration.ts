import {IComponentConfiguration} from "../../Component";

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

export default ICoverConfiguration;
