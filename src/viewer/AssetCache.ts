import {Node} from "../Graph";

interface ICacheData {
    lastUsed: Date;
    cached: boolean;
    loaded: boolean;
    data: any;
    loadFunc: (source: string, subString: string) => boolean;
    maxSize: number;
}

interface ICacheDataMap {
    [index: string]: ICacheData;
}

interface IAsset {
    sized: boolean;
    cacheData: ICacheDataMap;
}

export class AssetCache {
    public cache(nodes: Node[]): void {
        console.log("CACHE HERE");
    }

    public isLoaded(node: Node): boolean {
        return true;
    }
}

export default AssetCache
