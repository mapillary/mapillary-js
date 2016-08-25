import {IComponentConfiguration} from "../../Component";

export interface IRouteInfoKey {
    key: string;
    description: string;
}

export interface IRoutePath {
    sequenceKey: string;
    startKey: string;
    stopKey: string;
    infoKeys: IRouteInfoKey[];
}

export interface IRouteConfiguration extends IComponentConfiguration {
    paths?: IRoutePath[];
    playing?: boolean;
}

export default IRouteConfiguration;
