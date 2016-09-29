import {ISequence} from "../../API";

/**
 * Interface that describes the raw sequence response
 * from the API.
 *
 * @interface IAPINavImS
 */
export interface IAPINavImS extends ISequence {
    /**
     * The path.
     */
    path?: any;

    /**
     * Value indicating whether the sequence has been starred.
     */
    starred?: boolean;
}

export default IAPINavImS;
