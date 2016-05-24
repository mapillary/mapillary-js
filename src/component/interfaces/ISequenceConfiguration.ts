import {IComponentConfiguration} from "../../Component";
import {EdgeDirection} from "../../Edge";

export interface ISequenceConfiguration extends IComponentConfiguration {
    playing?: boolean;
    direction?: EdgeDirection;
}

export default ISequenceConfiguration;
