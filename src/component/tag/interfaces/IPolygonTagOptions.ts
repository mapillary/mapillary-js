import {TagLabelKind} from "../../../Component";

export interface IPolygonTagOptions {
    polygon: number[][];
    label: string;
    labelKind: TagLabelKind;
    editable: boolean;
}

export default IPolygonTagOptions;
