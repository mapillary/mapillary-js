import { SequenceEnt } from "../api/ents/SequenceEnt";

/**
 * @class Sequence
 *
 * @classdesc Represents a sequence of ordered nodes.
 */
export class Sequence {
    private _id: string;
    private _imageIds: string[];

    /**
     * Create a new sequene instance.
     *
     * @param {SequenceEnt} sequence - Raw sequence data.
     */
    constructor(sequence: SequenceEnt) {
        this._id = sequence.id;
        this._imageIds = sequence.image_ids;
    }

    /**
     * Get id.
     *
     * @returns {string} Unique sequence id.
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Get ids.
     *
     * @returns {Array<string>} Array of ordered node ids in the sequence.
     */
    public get imageIds(): string[] {
        return this._imageIds;
    }

    /**
     * Dispose the sequence.
     *
     * @description Disposes all cached assets.
     */
    public dispose(): void {
        this._id = null;
        this._imageIds = null;
    }

    /**
     * Find the next node id in the sequence with respect to
     * the provided node id.
     *
     * @param {string} id - Reference node id.
     * @returns {string} Next id in sequence if it exists, null otherwise.
     */
    public findNext(id: string): string {
        let i: number = this._imageIds.indexOf(id);

        if ((i + 1) >= this._imageIds.length || i === -1) {
            return null;
        } else {
            return this._imageIds[i + 1];
        }
    }

    /**
     * Find the previous node id in the sequence with respect to
     * the provided node id.
     *
     * @param {string} id - Reference node id.
     * @returns {string} Previous id in sequence if it exists, null otherwise.
     */
    public findPrev(id: string): string {
        let i: number = this._imageIds.indexOf(id);

        if (i === 0 || i === -1) {
            return null;
        } else {
            return this._imageIds[i - 1];
        }
    }
}
