import {IUIConfiguration} from "../../UI";

export interface ICoverUIConfiguration extends IUIConfiguration {
    key?: string;
    loading?: boolean;
    visible?: boolean;
}

export default ICoverUIConfiguration;
