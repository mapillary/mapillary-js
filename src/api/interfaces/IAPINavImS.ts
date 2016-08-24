/**
 * Interface that describes the raw sequence response
 * from the API.
 *
 * @interface IAPINavImS
 */
export interface IAPINavImS {
    /**
     * The unique sequence key.
     */
    key: string;

    /**
     * The ordered node keys of the sequence.
     */
    keys: string[];

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
