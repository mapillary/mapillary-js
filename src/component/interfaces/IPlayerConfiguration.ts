import {IComponentConfiguration} from "../../Component";
import {EdgeDirection} from "../../Edge";

export interface IPlayerConfiguration extends IComponentConfiguration {
    playing?: boolean;
    direction?: EdgeDirection;
}

export default IPlayerConfiguration;
