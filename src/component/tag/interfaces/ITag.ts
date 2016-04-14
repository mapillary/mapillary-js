import {TagLabel} from "../../../Component";

export interface ITag {
    id: string;
    rect: number[];
    value: string;
    label: TagLabel;
    editable: boolean;
}

export default ITag;
