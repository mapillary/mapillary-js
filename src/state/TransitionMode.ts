/**
 * Enumeration for transition mode
 * @enum {number}
 * @readonly
 * @description Modes for specifying how transitions
 * between nodes are performed.
 */
export enum TransitionMode {
    /**
     * Default transitions.
     *
     * @description The viewer dynamically determines
     * whether transitions should be performed with or
     * without motion and blending for each transition
     * based on the underlying data.
     */
    Default,

    /**
     * Instantaneous transitions.
     *
     * @description All transitions are performed
     * without motion or blending.
     */
    Instantaneous,
}

export default TransitionMode;
