import {IUIConfiguration} from "../../UI";

export interface ICoverUIConfiguration extends IUIConfiguration {
    buttonClicked: (conf: IUIConfiguration) => void;
    key: string;
    loading: boolean;
    visible: boolean;
    that: any;
}

export default ICoverUIConfiguration;
