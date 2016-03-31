import {IComponentConfiguration} from "../../Component";

export interface ICacheDepth {
    /**
     * Cache depth in the sequence directions.
     *
     * @description Max value is 4. Value will be coerced
     * to the intervale [0, 4].
     * @default 2
     */
    sequence: number;

    /**
     * Cache depth in the pano direction.
     *
     * @description Max value is 2. Value will be coerced
     * to the intervale [0, 2].
     * @default 1
     */
    pano: number;

    /**
     * Cache depth in the step directions.
     *
     * @description Max value is 3. Value will be coerced
     * to the intervale [0, 3].
     * @default 1
     */
    step: number;
}

export interface ICacheConfiguration extends IComponentConfiguration {
    depth?: ICacheDepth;
}

export default ICacheConfiguration;
