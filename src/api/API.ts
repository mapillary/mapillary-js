import { Observable, Subscriber, throwError as observableThrowError } from "rxjs";

import {
    ICoreNode,
    IFillNode,
    IFullNode,
    ISequence,
} from "../API";
import { IDataProvider } from "./interfaces/interfaces";
import MapillaryError from "../error/MapillaryError";

/**
 * @class API
 *
 * @classdesc Provides methods for access to the API.
 */
export class API {
    constructor(private _data: IDataProvider) { }

    public get data(): IDataProvider {
        return this._data;
    }

    public imageByKeyFill$(keys: string[]): Observable<{ [key: string]: IFillNode }> {
        return this._wrapPromise$(this._data.getFillImages(keys));
    }

    public imageByKeyFull$(keys: string[]): Observable<{ [key: string]: IFullNode }> {
        return this._wrapPromise$(this._data.getFullImages(keys));
    }

    public imageCloseTo$(lat: number, lon: number): Observable<IFullNode> {
        let lonLat: string = `${lon}:${lat}`;
        return observableThrowError(
            new MapillaryError("The image close to functionality is deprecated."));
    }

    public imagesByH$(hs: string[]): Observable<{ [h: string]: { [index: string]: ICoreNode } }> {
        return this._wrapPromise$(this._data.getCoreImages(hs));
    }

    public imageViewAdd$(keys: string[]): Observable<void> {
        return observableThrowError(
            new MapillaryError("The image view add functionality is deprecated."));
    }

    public sequenceByKey$(sequenceKeys: string[]): Observable<{ [sequenceKey: string]: ISequence }> {
        return this._wrapPromise$(this._data.getSequences(sequenceKeys));
    }

    public sequenceViewAdd$(sequenceKeys: string[]): Observable<void> {
        return observableThrowError(
            new MapillaryError("The sequence view add functionality is deprecated."));
    }

    public setToken(token?: string): void {
        this._data.setToken(token);
    }

    private _wrapPromise$<T>(promise: Promise<T>): Observable<T> {
        return Observable
            .create(
                (subscriber: Subscriber<T>): void => {
                    promise
                        .then(
                            (value: T): void => {
                                subscriber.next(value);
                                subscriber.complete();
                            },
                            (error: Error): void => {
                                subscriber.error(error);
                            });
                });
    }
}

export default API;
