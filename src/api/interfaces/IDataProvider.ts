import IFillNode from "./IFillNode";
import IFullNode from "./IFullNode";
import ICoreNode from "./ICoreNode";
import ISequence from "./ISequence";
import IClusterReconstruction from "../../component/spatialdata/interfaces/IClusterReconstruction";
import IMesh from "./IMesh";

/**
 * Interface that describes the data provider functionality.
 *
 * @interface IDataProvider
 */
export interface IDataProvider {
    getCoreImages(geohashes: string[]):
        Promise<{ [geohash: string]: { [imageKey: string]: ICoreNode } }>;
    getClusterReconstruction(clusterKey: string, abort?: Promise<void>):
        Promise<IClusterReconstruction>;
    getFillImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFillNode }>;
    getFullImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFullNode }>;
    getImage(imageKey: string, size: number, abort?: Promise<void>):
        Promise<ArrayBuffer>;
    getImageTile(
        imageKey: string,
        x: number,
        y: number,
        w: number,
        h: number,
        scaledW: number,
        scaledH: number,
        abort?: Promise<void>): Promise<ArrayBuffer>;
    getMesh(imageKey: string, abort?: Promise<void>): Promise<IMesh>;
    getSequences(sequenceKeys: string[]):
        Promise<{ [sequenceKey: string]: ISequence }>;
    setToken(token?: string): void;
}

export default IDataProvider;
