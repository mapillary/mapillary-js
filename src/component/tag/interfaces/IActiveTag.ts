import {ITag, TagOperation} from "../../../Component";

export interface IActiveTag {
    offsetX: number;
    offsetY: number;
    operation: TagOperation;
    tag: ITag;
}

export default IActiveTag;
