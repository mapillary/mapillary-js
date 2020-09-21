import IFillNode from "./IFillNode";
import IFullNode from "./IFullNode";
import ICoreNode from "./ICoreNode";
import ISequence from "./ISequence";

/**
 * Interface that describes the data provider functionality.
 *
 * @interface IDataProvider
 */
export interface IDataProvider {
    getCoreImages(geohashes: string[]):
        Promise<{ [geohash: string]: { [imageKey: string]: ICoreNode } }>;
    getFillImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFillNode }>;
    getFullImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFullNode }>;
    getSequences(sequenceKeys: string[]):
        Promise<{ [sequenceKey: string]: ISequence }>;
    setToken(token?: string): void;
}

export default IDataProvider;
