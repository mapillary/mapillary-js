import * as pako from "pako";
import Pbf from "pbf";
import { MapillaryError } from "../error/MapillaryError";
import { MeshContract } from "./contracts/MeshContract";

export interface XMLHttpRequestHeader {
    name: string,
    value: string,
}

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
    const method = "GET";
    const responseType = "arraybuffer";
    return xhrFetch(url, method, responseType, [], null, abort);
}

export function xhrFetch(
    url: string,
    method: "GET",
    responseType: "arraybuffer",
    headers: XMLHttpRequestHeader[],
    body?: string,
    abort?: Promise<void>): Promise<ArrayBuffer>;
export function xhrFetch<TResult>(
    url: string,
    method: "GET" | "POST",
    responseType: "json",
    headers: XMLHttpRequestHeader[],
    body?: string,
    abort?: Promise<void>): Promise<TResult>;
export function xhrFetch<TResult>(
    url: string,
    method: "GET" | "POST",
    responseType: "arraybuffer" | "json",
    headers: XMLHttpRequestHeader[],
    body?: string,
    abort?: Promise<void>): Promise<TResult> {

    const xhr = new XMLHttpRequest();
    const promise = new Promise<TResult>(
        (resolve, reject) => {
            xhr.open(method, url, true);
            for (const header of headers) {
                xhr.setRequestHeader(header.name, header.value);
            }
            xhr.responseType = responseType;
            xhr.timeout = 15000;

            xhr.onload = () => {
                if (xhr.status !== 200) {
                    const error = xhr.response ??
                        new MapillaryError(`Response status error: ${url}`);
                    reject(error);
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
            xhr.send(method === "POST" ? body : null);
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
