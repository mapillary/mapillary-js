import {IComponentConfiguration} from "../../Component";

export interface ICoverConfiguration extends IComponentConfiguration {
    key?: string;
    loading?: boolean;
    visible?: boolean;
}

export default ICoverConfiguration;
