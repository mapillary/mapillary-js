import {Tag, TagOperation} from "../../../Component";

export interface IActiveTag {
    resizeIndex?: number;
    offsetX: number;
    offsetY: number;
    operation: TagOperation;
    tag: Tag;
}

export default IActiveTag;
