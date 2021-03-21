import {
    Observable,
    Subscriber,
} from "rxjs";
import { DataProviderBase } from "./DataProviderBase";
import { CoreImagesContract } from "./contracts/CoreImagesContract";
import { ImagesContract } from "./contracts/ImagesContract";
import { SpatialImagesContract } from "./contracts/SpatialImagesContract";
import { SequencesContract } from "./contracts/SequencesContract";

/**
 * @class API
 *
 * @classdesc Provides methods for access to the API.
 */
export class APIWrapper {
    constructor(private readonly _data: DataProviderBase) { }

    public get data(): DataProviderBase {
        return this._data;
    }

    public getSpatialImages$(
        imageIds: string[]): Observable<SpatialImagesContract> {
        return this._wrap$(this._data.getSpatialImages(imageIds));
    }

    public getImages$(imageIds: string[]): Observable<ImagesContract> {
        return this._wrap$(this._data.getImages(imageIds));
    }

    public getCoreImages$(cellId: string): Observable<CoreImagesContract> {
        return this._wrap$(this._data.getCoreImages(cellId));
    }

    public getSequences$(sequenceIds: string[]): Observable<SequencesContract> {
        return this._wrap$(this._data.getSequences(sequenceIds));
    }

    public setUserToken(userToken?: string): void {
        this._data.setUserToken(userToken);
    }

    private _wrap$<T>(promise: Promise<T>): Observable<T> {
        return Observable.create(
            (subscriber: Subscriber<T>): void => {
                promise.then(
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
