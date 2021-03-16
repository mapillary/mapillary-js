import { IDEnt } from "./IDEnt";

/**
 * Interface that describes the raw image user properties.
 *
 * @interface UserEnt
 */
export interface UserEnt extends IDEnt {
    /**
     * The username of the user.
     */
    username: string;
}
