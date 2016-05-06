import {Tag, TagOperation} from "../../../Component";

export interface IInteraction {
    offsetX: number;
    offsetY: number;
    operation: TagOperation;
    pointIndex?: number;
    tag: Tag;
}

export default IInteraction;
