import * as pako from "pako";
import Pbf from "pbf";
import { MapillaryError } from "../error/MapillaryError";
import { MeshContract } from "./contracts/MeshContract";

/**
 * Decompress and parse an array buffer containing zipped
 * json data and return as a json object.
 *
 * @description Handles array buffers continaing zipped json
 * data.
 *
 * @param {ArrayBuffer} buffer - Array buffer to decompress.
 * @returns {Object} Parsed object.
 */
export function decompress<T>(buffer: ArrayBuffer): T {
    const inflated: string =
        pako.inflate(<pako.Data>buffer, { to: "string" });

    return <T>JSON.parse(inflated);
}

/**
 * Retrieves a resource as an array buffer and returns a promise
 * to the buffer.
 *
 * @description Rejects the promise on request failure.
 *
 * @param {string} url - URL for resource to retrieve.
 * @param {Promise} [abort] - Optional promise for aborting
 * the request through rejection.
 * @returns {Promise<ArrayBuffer>} Promise to the array buffer
 * resource.
 */
export function fetchArrayBuffer(
    url: string,
    abort?: Promise<void>): Promise<ArrayBuffer> {
    const xhr = new XMLHttpRequest();
    const promise = new Promise<ArrayBuffer>(
        (resolve, reject) => {
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.timeout = 15000;

            xhr.onload = () => {
                if (xhr.status !== 200) {
                    reject(new MapillaryError(`Response status error: ${url}`));
                }

                if (!xhr.response) {
                    reject(new MapillaryError(`Response empty: ${url}`));
                }

                resolve(xhr.response);
            };

            xhr.onerror = () => {
                reject(new MapillaryError(`Request error: ${url}`));
            };
            xhr.ontimeout = () => {
                reject(new MapillaryError(`Request timeout: ${url}`));
            };
            xhr.onabort = () => {
                reject(new MapillaryError(`Request aborted: ${url}`));
            };
            xhr.send(null);
        });

    if (!!abort) { abort.catch((): void => { xhr.abort(); }); }

    return promise;
}

/**
 * Read the fields of a protobuf array buffer into a mesh
 * object.
 *
 * @param {ArrayBuffer} buffer - Protobuf array buffer
 * to read from.
 * @returns {MeshContract} Mesh object.
 */
export function readMeshPbf(buffer: ArrayBuffer): MeshContract {
    const pbf = new Pbf(buffer);
    const mesh: MeshContract = { faces: [], vertices: [] };
    return pbf.readFields(readMeshPbfField, mesh);
}

function readMeshPbfField(tag: number, mesh: MeshContract, pbf: Pbf): void {
    if (tag === 1) { mesh.vertices.push(pbf.readFloat()); }
    else if (tag === 2) { mesh.faces.push(pbf.readVarint()); }
    else { console.warn(`Unsupported pbf tag (${tag})`); }
}
