import MapillaryError from "../component/tag/error/GeometryTagError";

export class BufferFetcher {
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
