import {Node} from "../Graph";

export class AssetCache {
    public cache(nodes: Node[]): void {
        console.log("CACHE HERE");
    }

    public isLoaded(node: Node): boolean {
        return true;
    }
}

export default AssetCache
