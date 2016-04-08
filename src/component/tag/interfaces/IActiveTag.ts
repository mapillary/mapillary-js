import {Tag, TagOperation} from "../../../Component";

export interface IActiveTag {
    offsetX: number;
    offsetY: number;
    operation: TagOperation;
    tag: Tag;
}

export default IActiveTag;
