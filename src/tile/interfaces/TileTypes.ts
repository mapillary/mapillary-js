export const TILE_MIN_REQUEST_LEVEL = 11;
export const TILE_SIZE = 1024;

export interface TileImageSize {
    h: number;
    w: number;
}

export interface TileCoords2D {
    x: number;
    y: number;
}

export interface TileCoords3D extends TileCoords2D {
    z: number;
}

export interface TilePixelCoords2D extends
    TileImageSize,
    TileCoords2D { }

export interface TileLevelColumnRows {
    columns: number;
    rows: number;
}

export interface TileLevel {
    z: number;
    max: number;
}
