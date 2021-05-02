import {
    TileImageSize,
    TileCoords3D,
    TilePixelCoords2D,
    TileCoords2D,
    TileLevelColumnRows,
    TileLevel,
    TILE_MIN_REQUEST_LEVEL,
    TILE_SIZE,
} from "./interfaces/TileTypes";

function clamp(
    value: number,
    min: number,
    max: number)
    : number {
    return Math.max(min, Math.min(max, value));
}

export function tileMinRequestLevel(): number {
    return TILE_MIN_REQUEST_LEVEL;
}

export function tileSize(): number {
    return TILE_SIZE;
}

export function levelTilePixelSize(level: TileLevel): number {
    return TILE_SIZE / levelScale(level);
}

export function levelScale(level: TileLevel): number {
    return Math.pow(2, level.z - level.max);
}

export function rawImageLevel(size: TileImageSize): number {
    const s = Math.max(size.w, size.h);
    return Math.log(s) / Math.log(2);
}

export function baseImageLevel(size: TileImageSize): number {
    return Math.ceil(rawImageLevel(size));
}

export function clampedImageLevel(
    size: TileImageSize,
    min: number,
    max: number)
    : number {
    return Math.max(min, Math.min(max, baseImageLevel(size)));
}

export function sizeToLevelColumnsRows(
    size: TileImageSize,
    level: TileLevel): TileLevelColumnRows {
    const scale = levelScale(level);
    const rows = Math.ceil(scale * size.h / TILE_SIZE);
    const columns = Math.ceil(scale * size.w / TILE_SIZE);
    return { columns, rows };
}

export function basicToTileCoords2D(
    basic: number[],
    size: TileImageSize,
    level: TileLevel): TileCoords2D {

    const tilePixelSize = levelTilePixelSize(level);
    const w = size.w;
    const h = size.h;
    const maxX = Math.ceil(w / tilePixelSize) - 1;
    const maxY = Math.ceil(h / tilePixelSize) - 1;
    const x = clamp(
        Math.floor(w * basic[0] / tilePixelSize),
        0,
        maxX);
    const y = clamp(
        Math.floor(h * basic[1] / tilePixelSize),
        0,
        maxY);

    return { x, y };
}

export function tileToPixelCoords2D(
    tile: TileCoords2D,
    size: TileImageSize,
    level: TileLevel)
    : TilePixelCoords2D {
    const scale = 1 / levelScale(level);
    const scaledTS = scale * TILE_SIZE;
    const x = scaledTS * tile.x;
    const y = scaledTS * tile.y;
    const w = Math.min(scaledTS, size.w - x);
    const h = Math.min(scaledTS, size.h - y);
    return { h, x, y, w };
}

function hasOverlap1D(
    low: number,
    base: number,
    scale: number)
    : boolean {
    return (
        scale * low <= base &&
        base < scale * (low + 1)
    );
}

export function hasOverlap2D(
    tile1: TileCoords3D,
    tile2: TileCoords3D)
    : boolean {
    if (tile1.z === tile2.z) {
        return tile1.x === tile2.x && tile1.y === tile2.y;
    }

    const low = tile1.z < tile2.z ? tile1 : tile2;
    const base = tile1.z < tile2.z ? tile2 : tile1;
    const scale = 1 / levelScale({ max: base.z, z: low.z });
    const overlapX = hasOverlap1D(low.x, base.x, scale);
    const overlapY = hasOverlap1D(low.y, base.y, scale);

    return overlapX && overlapY;
}

export function cornersToTilesCoords2D(
    topLeft: TileCoords2D,
    bottomRight: TileCoords2D,
    size: TileImageSize,
    level: TileLevel)
    : TileCoords2D[] {

    const xs: number[] = [];
    if (topLeft.x > bottomRight.x) {
        const tilePixelSize = levelTilePixelSize(level);

        const maxX = Math.ceil(size.w / tilePixelSize) - 1;
        for (let x = topLeft.x; x <= maxX; x++) {
            xs.push(x);
        }
        for (let x = 0; x <= bottomRight.x; x++) {
            xs.push(x);
        }
    } else {
        for (let x = topLeft.x; x <= bottomRight.x; x++) {
            xs.push(x);
        }
    }

    const tiles: TileCoords2D[] = [];
    for (const x of xs) {
        for (let y = topLeft.y; y <= bottomRight.y; y++) {
            tiles.push({ x, y });
        }
    }
    return tiles;
}


export function verifySize(size: TileImageSize): boolean {
    return size.w > 0 && size.h > 0;
}
