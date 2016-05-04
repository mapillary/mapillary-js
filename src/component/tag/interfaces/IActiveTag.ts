import {TagBase, TagOperation} from "../../../Component";

export interface IActiveTag {
    resizeIndex?: number;
    offsetX: number;
    offsetY: number;
    operation: TagOperation;
    tag: TagBase;
}

export default IActiveTag;
