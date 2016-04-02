import {IComponentConfiguration} from "../../Component";

export interface ICacheDepth {
    /**
     * Cache depth in the sequence directions.
     *
     * @description Max value is 4. Value will be coerced
     * to the interval [0, 4].
     * @default 2
     */
    sequence: number;

    /**
     * Cache depth in the pano direction.
     *
     * @description Max value is 2. Value will be coerced
     * to the interval [0, 2].
     * @default 1
     */
    pano: number;

    /**
     * Cache depth in the step directions.
     *
     * @description Max value is 3. Value will be coerced
     * to the interval [0, 3].
     * @default 1
     */
    step: number;

    /**
     * Cache depth in the turn directions.
     *
     * @description Max value is 1. Value will be coerced
     * to the interval [0, 1].
     * @default 0
     */
    turn: number;
}

export interface ICacheConfiguration extends IComponentConfiguration {
    depth?: ICacheDepth;
}

export default ICacheConfiguration;
