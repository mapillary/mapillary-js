import {
    Observable,
    Subscriber,
} from "rxjs";
import { DataProviderBase } from "./DataProviderBase";

import { CoreImageEnt } from "./ents/CoreImageEnt";
import { SpatialImageEnt } from "./ents/SpatialImageEnt";
import { ImageEnt } from "./ents/ImageEnt";
import { SequenceEnt } from "./ents/SequenceEnt";

/**
 * @class API
 *
 * @classdesc Provides methods for access to the API.
 */
export class APIWrapper {
    constructor(private _data: DataProviderBase) { }

    public get data(): DataProviderBase {
        return this._data;
    }

    public imageByKeyFill$(keys: string[]): Observable<{ [key: string]: SpatialImageEnt }> {
        return this._wrapPromise$(this._data.getFillImages(keys));
    }

    public imageByKeyFull$(keys: string[]): Observable<{ [key: string]: ImageEnt }> {
        return this._wrapPromise$(this._data.getFullImages(keys));
    }

    public imagesByH$(h: string): Observable<{ [h: string]: { [index: string]: CoreImageEnt } }> {
        return this._wrapPromise$(this._data.getCoreImages(h));
    }

    public sequenceByKey$(sequenceKeys: string[]): Observable<{ [sequenceKey: string]: SequenceEnt }> {
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
