import {TagLabelKind} from "../../../Component";

export interface ITagOptions {
    rect: number[];
    label: string;
    labelKind: TagLabelKind;
    editable: boolean;
}

export default ITagOptions;
