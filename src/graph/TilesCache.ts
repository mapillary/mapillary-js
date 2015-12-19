export class CachedTile {
    public fetching: boolean;
    public cached: boolean;

    constructor (
        fetching: boolean,
        cached: boolean) {
        this.fetching = fetching;
        this.cached = cached;
    }
}

export class TilesCache {
    private cachedTiles: {[key: string]: CachedTile};

    constructor () {
        this.cachedTiles = {};
    }

    public get(key: string): CachedTile {
        return this.cachedTiles[key];
    }

    public set(key: string, cachedTile: CachedTile): void {
        this.cachedTiles[key] = cachedTile;
    }
}

export default TilesCache;
