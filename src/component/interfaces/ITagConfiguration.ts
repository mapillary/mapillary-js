import {IComponentConfiguration} from "../../Component";

export interface ITagConfiguration extends IComponentConfiguration {
    creating?: boolean;
    createType?: "polygon" | "rect";
}

export default ITagConfiguration;
