import {ITag} from "../../../Component";

export interface INodeTags {
    approve: { [tagKey: string]: ITag };
    change: { [tagKey: string]: ITag };
    create: { [tagKey: string]: ITag };
    reject: { [tagKey: string]: ITag };
}

export default INodeTags;
