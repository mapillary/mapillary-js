import {IComponentConfiguration} from "../../Component";
import {EdgeDirection} from "../../Edge";

export interface ISequenceConfiguration extends IComponentConfiguration {
    direction?: EdgeDirection;
    highlightKey?: string;

    /**
     * The max width of the sequence container.
     *
     * @description If the min width is larger than the max width the
     * min width value will be used.
     * @default 117
     */
    maxWidth?: number;

    /**
     * The min width of the sequence container.
     *
     * @description If the min width is larger than the max width the
     * min width value will be used.
     * @default 70
     */
    minWidth?: number;

    playing?: boolean;
    visible?: boolean;
}

export default ISequenceConfiguration;
