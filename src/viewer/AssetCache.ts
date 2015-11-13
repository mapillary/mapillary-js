/// <reference path="../../typings/when/when.d.ts" />

import * as when from "when";

import {Node} from "../Graph";

interface ICacheData {
    lastUsed: Date;
    cached: boolean;
    loaded: boolean;
    data: any;
}

interface ICacheDataMap {
    [key: string]: ICacheData;
}

interface IAsset {
    sized: boolean;
    load: (node: Node) => when.Promise<{}>;
    maxSize: number;
    name: string;
    cacheData: ICacheDataMap;
}

interface IAssetMap {
    [key: string]: IAsset;
}

class ImageAsset implements IAsset {
    public sized: boolean;
    public maxSize: number;
    public name: string;
    public cacheData: ICacheDataMap;

    constructor (name: string) {
        this.sized = true;
        this.maxSize = 30;
        this.cacheData = {};
        this.name = name;
    }

    public load(node: Node): when.Promise<{}> {
        return when.promise((resolve: (value: any) => void, reject: (reason: any) => void): void => {
            let img:  HTMLImageElement = new Image();
            img.crossOrigin = "Anonymous";

            img.onload = () => {
                resolve({node: node, img: img});
            };

            img.onerror = () => {
                resolve({node: node, img: img});
            };

            img.src = "https://d1cuyjsrcm0gby.cloudfront.net/" + node.key + "/thumb-640.jpg?origin=mapillary.webgl";
        });
    }

}

class MeshAsset implements IAsset {
    public sized: boolean;
    public maxSize: number;
    public name: string;
    public cacheData: ICacheDataMap;

    constructor (name: string) {
        this.sized = false;
        this.maxSize = 30;
        this.cacheData = {};
        this.name = name;
    }

    public load(node: Node): when.Promise<{}> {
        return when(true);
    }
}

export class AssetCache {
    private availbleAssets: IAssetMap;
    private enabledAssets: IAssetMap;

    constructor () {
        this.availbleAssets = {};
        this.enabledAssets = {};
        this.setupAvailbleAssets();
    }

    public cache(nodes: Node[]): when.Promise<{}> {
        let cachedAssets: when.Promise<{}>[] = [];

        for (var i in nodes) {
            if (nodes.hasOwnProperty(i)) {
                let node: Node = nodes[i];
                if (!this.isCached(node)) {
                    cachedAssets.push(this.cacheAsset(node));
                }
            }
        }

        return when.all(cachedAssets).then((data: any): when.Promise<{}> => {
            return data;
        });
    }

    public enableAsset(assetName: string): boolean {
        if (!(assetName in this.availbleAssets)) {
            return false;
        }
        this.enabledAssets[assetName] = this.availbleAssets[assetName];
        return true;
    }

    public isCached(node: Node): boolean {
        for (var name in this.enabledAssets) {
            if (this.enabledAssets.hasOwnProperty(name)) {
                let asset: IAsset = this.enabledAssets[name];
                if (!this.nodeIsCachedInAsset(asset, node)) {
                    return false;
                }
            }
        }
        return true;
    }

    private nodeIsCachedInAsset(asset: IAsset, node: Node): boolean {
        return ((node.key in asset.cacheData) && asset.cacheData[node.key].cached);
    }

    private cacheAsset(node: Node): when.Promise<{}> {
        let cachedNodes: when.Promise<{}>[] = [];

        for (var name in this.enabledAssets) {
            if (this.enabledAssets.hasOwnProperty(name)) {
                let asset: IAsset = this.enabledAssets[name];
                if (!this.isCached(node)) {
                    cachedNodes.push(asset.load(node));
                }
            }
        }
        return when.all(cachedNodes);
    }

    private setupAvailbleAssets(): void {
        let imageAsset: ImageAsset = new ImageAsset("image");
        this.availbleAssets[imageAsset.name] = imageAsset;

        let meshAsset: MeshAsset = new MeshAsset("mesh");
        this.availbleAssets[meshAsset.name] = meshAsset;
    }
}

export default AssetCache
