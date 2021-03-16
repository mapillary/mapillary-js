import { KeyedEnt } from "./KeyedEnt";

/**
 * Interface that describes the raw image user properties.
 *
 * @interface UserEnt
 */
export interface UserEnt extends KeyedEnt {
    /**
     * The username of the user.
     */
    username: string;
}
