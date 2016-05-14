import {Tag, TagOperation} from "../../../Component";

export interface IInteraction {
    offsetX: number;
    offsetY: number;
    operation: TagOperation;
    tag: Tag;
    vertexIndex?: number;
}

export default IInteraction;
