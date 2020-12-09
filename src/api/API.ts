import { Observable, Subscriber, throwError as observableThrowError } from "rxjs";

import {
    ICoreNode,
    IFillNode,
    IFullNode,
    ISequence,
} from "../API";
import { IDataProvider } from "./interfaces/interfaces";

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

    public imagesByH$(h: string): Observable<{ [h: string]: { [index: string]: ICoreNode } }> {
        return this._wrapPromise$(this._data.getCoreImages(h));
    }

    public sequenceByKey$(sequenceKeys: string[]): Observable<{ [sequenceKey: string]: ISequence }> {
        return this._wrapPromise$(this._data.getSequences(sequenceKeys));
    }

    public setUserToken(userToken?: string): void {
        this._data.setUserToken(userToken);
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
