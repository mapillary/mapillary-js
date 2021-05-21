import { IDEnt } from "./IDEnt";

/**
 * Ent representing URL properties.
 */
export interface URLEnt extends IDEnt {
    /**
     * URL for fetching ent data.
     */
    url: string;
}
