import {IUIConfiguration} from "../../Component";

export interface ICoverUIConfiguration extends IUIConfiguration {
    key?: string;
    loading?: boolean;
    visible?: boolean;
}

export default ICoverUIConfiguration;
