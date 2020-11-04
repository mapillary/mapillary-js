import IDataProvider from "./interfaces/IDataProvider";
import MapillaryError from "../error/MapillaryError";
import ICoreNode from "./interfaces/ICoreNode";
import IClusterReconstruction from "./interfaces/IClusterReconstruction";
import IFillNode from "./interfaces/IFillNode";
import IFullNode from "./interfaces/IFullNode";
import IMesh from "./interfaces/IMesh";
import ISequence from "./interfaces/ISequence";
import IGeometryProvider from "./interfaces/IGeometryProvider";
import GeometryProviderBase from "./GeometryProviderBase";

export class DataProviderBase implements IDataProvider {
    constructor(protected _geometry: IGeometryProvider) {
        if (!(this._geometry instanceof GeometryProviderBase)) {
            throw new MapillaryError(
                "The data provider requires a geometry provider base instance.");
        }
    }

    public get geometry(): IGeometryProvider {
        return this._geometry;
    }

    public getCoreImages(cellId: string):
        Promise<{ [cellId: string]: { [imageKey: string]: ICoreNode } }> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    public getClusterReconstruction(clusterKey: string, abort?: Promise<void>):
        Promise<IClusterReconstruction> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    public getFillImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFillNode }> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    public getFullImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFullNode }> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    public getImage(url: string, abort?: Promise<void>):
        Promise<ArrayBuffer> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    public getImageTile(
        imageKey: string,
        x: number,
        y: number,
        w: number,
        h: number,
        scaledW: number,
        scaledH: number,
        abort?: Promise<void>): Promise<ArrayBuffer> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    public getMesh(imageKey: string, abort?: Promise<void>): Promise<IMesh> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    public getSequences(sequenceKeys: string[]):
        Promise<{ [sequenceKey: string]: ISequence }> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    public setToken(token?: string): void {
        throw new MapillaryError("Not implemented");
    }

    protected _getArrayBuffer(url: string, abort?: Promise<void>): Promise<ArrayBuffer> {
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

export default DataProviderBase;
