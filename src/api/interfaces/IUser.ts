import { IKey } from "./IKey";

/**
 * Interface that describes the raw image user properties.
 *
 * @interface IUser
 */
export interface IUser extends IKey {
    /**
     * The username of the user.
     */
    username: string;
}
