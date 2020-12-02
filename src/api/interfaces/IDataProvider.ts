import IFillNode from "./IFillNode";
import IFullNode from "./IFullNode";
import ICoreNode from "./ICoreNode";
import ISequence from "./ISequence";
import IMesh from "./IMesh";
import IClusterReconstruction from "./IClusterReconstruction";
import IGeometryProvider from "./IGeometryProvider";

/**
 * Interface that describes the data provider functionality.
 *
 * @interface IDataProvider
 */
export interface IDataProvider {
    readonly geometry: IGeometryProvider;

    getCoreImages(cellId: string):
        Promise<{ [cellId: string]: { [imageKey: string]: ICoreNode } }>;
    getClusterReconstruction(url: string, abort?: Promise<void>):
        Promise<IClusterReconstruction>;
    getFillImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFillNode }>;
    getFullImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFullNode }>;
    getImage(url: string, abort?: Promise<void>):
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
    getMesh(url: string, abort?: Promise<void>): Promise<IMesh>;
    getSequences(sequenceKeys: string[]):
        Promise<{ [sequenceKey: string]: ISequence }>;
    setUserToken(userToken?: string): void;
}

export default IDataProvider;
