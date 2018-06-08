import {ISequence} from "../API";

/**
 * @class Sequence
 *
 * @classdesc Represents a sequence of ordered nodes.
 */
export class Sequence {
    private _key: string;
    private _keys: string[];

    /**
     * Create a new sequene instance.
     *
     * @param {ISequence} sequence - Raw sequence data.
     */
    constructor(sequence: ISequence) {
        this._key = sequence.key;
        this._keys = sequence.keys;
    }

    /**
     * Get key.
     *
     * @returns {string} Unique sequence key.
     */
    public get key(): string {
        return this._key;
    }

    /**
     * Get keys.
     *
     * @returns {Array<string>} Array of ordered node keys in the sequence.
     */
    public get keys(): string[] {
        return this._keys;
    }

    /**
     * Dispose the sequence.
     *
     * @description Disposes all cached assets.
     */
    public dispose(): void {
        this._key = null;
        this._keys = null;
    }

    /**
     * Find the next node key in the sequence with respect to
     * the provided node key.
     *
     * @param {string} key - Reference node key.
     * @returns {string} Next key in sequence if it exists, null otherwise.
     */
    public findNextKey(key: string): string {
        let i: number = this._keys.indexOf(key);

        if ((i + 1) >= this._keys.length || i === -1) {
            return null;
        } else {
            return this._keys[i + 1];
        }
    }

    /**
     * Find the previous node key in the sequence with respect to
     * the provided node key.
     *
     * @param {string} key - Reference node key.
     * @returns {string} Previous key in sequence if it exists, null otherwise.
     */
    public findPrevKey(key: string): string {
        let i: number = this._keys.indexOf(key);

        if (i === 0 || i === -1) {
            return null;
        } else {
            return this._keys[i - 1];
        }
    }
}

export default Sequence;
