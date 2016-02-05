import {IComponentConfiguration} from "../../Component";

export interface ICoverUIConfiguration extends IComponentConfiguration {
    key?: string;
    loading?: boolean;
    visible?: boolean;
}

export default ICoverUIConfiguration;
