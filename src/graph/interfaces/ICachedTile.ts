export interface ICachedTile {
    key: string;
    cached: boolean;
    fetching: boolean;
    lastUsed: Date;
}

export default ICachedTile;
