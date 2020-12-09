import MapillaryError from "../error/MapillaryError";

/**
 * @class BufferFetcher
 *
 * @classdesc Static helper class used to get static resources as
 * array buffers.
 */
export class BufferFetcher {
    /**
     * Retrieves a resource as an array buffer and returns a promise
     * to the buffer.
     *
     * @description Rejects the promise on request failure.
     *
     * @static
     * @param {string} url - URL for resource to retrieve.
     * @param {Promise} [abort] - Optional promise for aborting
     * the request through rejection.
     *
     * @returns {Promise<ArrayBuffer>} Promise to the array buffer
     * resource.
     */
    public static getArrayBuffer(url: string, abort?: Promise<void>): Promise<ArrayBuffer> {
        const xhr: XMLHttpRequest = new XMLHttpRequest();

        const promise: Promise<ArrayBuffer> = new Promise(
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

                xhr.ontimeout = (e: Event) => {
                    reject(new MapillaryError(`Request timeout: ${url}`));
                };

                xhr.onabort = (e: Event) => {
                    reject(new MapillaryError(`Request aborted: ${url}`));
                };

                xhr.send(null);
            });

        if (!!abort) { abort.catch((): void => { xhr.abort(); }); }

        return promise;
    }
}

export default BufferFetcher;
