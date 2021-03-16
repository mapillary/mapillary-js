import { IDEnt } from "./IDEnt";

/**
 * Interface that describes the raw image cluster properties.
 *
 * @interface ClusterEnt
 */
export interface ClusterEnt extends IDEnt {
    /**
     * URL for reconstruction cluster resource.
     */
    url?: string;
}
