import {Tag, TagOperation} from "../../../Component";

export type InteractionCursor = "crosshair" | "move" |"nesw-resize" | "nwse-resize";

export interface IInteraction {
    cursor?: InteractionCursor;
    offsetX: number;
    offsetY: number;
    operation: TagOperation;
    tag: Tag;
    vertexIndex?: number;
}

export default IInteraction;
