import { DataProviderBase } from "../DataProviderBase";

export interface IDataAddedEvent {
    type: string;
    target: DataProviderBase;
    cellIds: string[];
}
