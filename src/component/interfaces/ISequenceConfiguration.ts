import {IComponentConfiguration} from "../../Component";
import {EdgeDirection} from "../../Edge";

export interface ISequenceConfiguration extends IComponentConfiguration {
    direction?: EdgeDirection;
    highlightKey?: string;
    playing?: boolean;
    visible?: boolean;
}

export default ISequenceConfiguration;
