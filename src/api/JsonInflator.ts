import * as pako from "pako";

/**
 * @class JsonInflator
 *
 * @classdesc Static helper class used to decompress array
 * buffers containing zipped json data.
 */
export class JsonInflator {
    /**
     * Decompress and parse an array buffer and return as a json
     * object.
     *
     * @description Handles array buffers continaing zipped json
     * data.
     *
     * @static
     * @param {ArrayBuffer} buffer - Array buffer to decompress.
     *
     * @returns {Object} Parsed object.
     */
    public static decompress<T>(buffer: ArrayBuffer): T {
        const inflated: string =
            pako.inflate(<pako.Data>buffer, { to: "string" });

        return <T>JSON.parse(inflated);
    }
}

export default JsonInflator;
