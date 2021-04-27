import {
    TileImageSize,
    TILE_SIZE,
} from "../../tile/interfaces/TileTypes";
import {
    tileToPixelCoords2D,
    baseImageLevel,
    sizeToLevelColumnsRows,
} from "../../tile/TileMath";
import { ImageTilesContract } from "../contracts/ImageTilesContract";
import { ImageTilesRequestContract }
    from "../contracts/ImageTilesRequestContract";
import { ImageTileEnt } from "../ents/ImageTileEnt";
import { SpatialImageEnt } from "../ents/SpatialImageEnt";
import { FalcorDataProviderUrls } from "./FalcorDataProviderUrls";

export class FalcorTileURLGenerator {
    private readonly _sizes: Map<string, TileImageSize>;

    constructor(
        private readonly _urls: FalcorDataProviderUrls) {
        this._sizes = new Map<string, TileImageSize>();
    }

    public add(images: SpatialImageEnt[]): void {
        const sizes = this._sizes;
        for (const image of images) {
            if (sizes.has(image.id)) { continue; }
            const h = image.height;
            const w = image.width;
            sizes.set(image.id, { h, w });
        }
    }

    public generate(request: ImageTilesRequestContract): ImageTilesContract {
        const imageId = request.imageId;
        if (!this._sizes.has(imageId)) {
            throw new Error(`Missing image (${imageId})`);
        }
        const size = this._sizes.get(imageId);
        const maxLevel = baseImageLevel(size);
        if (request.z > maxLevel) {
            throw new Error(
                `Invalid level ${request.z} ` +
                `(max ${maxLevel} for ${imageId})`);
        }
        const node: ImageTileEnt[] = [];
        if (typeof request.x === "number" &&
            typeof request.y === "number") {
            const url = this._generate(request, maxLevel);
            node.push({
                url,
                x: request.x,
                y: request.y,
                z: request.z,
            });
        } else {
            const level = { max: maxLevel, z: request.z };
            const coords = sizeToLevelColumnsRows(size, level);
            for (let y = 0; y < coords.rows; ++y) {
                for (let x = 0; x < coords.columns; ++x) {
                    const virtualRequest = {
                        imageId: request.imageId,
                        x,
                        y,
                        z: request.z,
                    };
                    const url = this._generate(virtualRequest, maxLevel);
                    node.push({
                        url,
                        x,
                        y,
                        z: request.z,
                    });
                }
            }
        }

        const result: ImageTilesContract = {
            node_id: imageId,
            node,
        };
        return result;
    }

    private _generate(
        request: ImageTilesRequestContract,
        maxLevel: number)
        : string {

        const pixels = tileToPixelCoords2D(
            { x: request.x, y: request.y },
            this._sizes.get(request.imageId),
            { max: maxLevel, z: request.z });

        const coordsStr = `${pixels.x},${pixels.y},${pixels.w},${pixels.h}`;
        const sizeStr = `!${TILE_SIZE},${TILE_SIZE}`;
        return this._urls
            .imageTile(
                request.imageId,
                coordsStr,
                sizeStr);
    }
}
